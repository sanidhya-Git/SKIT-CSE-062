'use strict';

const { v4: uuidv4 } = require('uuid');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const ApprovalRepository = require('../repositories/ApprovalRepository');
const AIService = require('../services/AIService');
const registry = require('../connectors/registry');
const IntegrationService = require('../services/IntegrationService');
const logger = require('../utils/logger');

class StepExecutor {
  /**
   * Execute a single workflow step.
   * @param {object} step          Step definition
   * @param {object} context       { runId, orgId, input, variables, stepOutputs }
   * @returns {Promise<{ output: any, status: 'completed'|'failed'|'waiting_approval'|'skipped' }>}
   */
  async execute(step, context) {
    const { runId, orgId, input, variables, stepOutputs } = context;

    logger.info({ runId, orgId, stepId: step.id, stepType: step.type, action: 'step.execute' }, 'Executing step');

    switch (step.type) {
      case 'condition':
        return this._executeCondition(step, context);
      case 'transform':
        return this._executeTransform(step, context);
      case 'delay':
        return this._executeDelay(step, context);
      case 'approval':
        return this._executeApproval(step, context);
      case 'ai_task':
        return this._executeAiTask(step, context);
      case 'connector_action':
        return this._executeConnectorAction(step, context);
      case 'notification':
        return this._executeNotification(step, context);
      case 'sub_workflow':
        return this._executeSubWorkflow(step, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  async _executeCondition(step, context) {
    const { config: cfg = {} } = step;
    const { stepOutputs = {}, input = {} } = context;

    // Evaluate a simple condition expression
    // cfg.condition: a JSONPath-like string or simple comparison
    // cfg.operator: 'eq', 'neq', 'gt', 'lt', 'contains', 'truthy'
    // cfg.left, cfg.right
    let left = this._resolve(cfg.left, { input, outputs: stepOutputs });
    let right = cfg.right;

    let result = false;
    switch (cfg.operator || 'truthy') {
      case 'eq': result = left == right; break;
      case 'neq': result = left != right; break;
      case 'gt': result = Number(left) > Number(right); break;
      case 'lt': result = Number(left) < Number(right); break;
      case 'gte': result = Number(left) >= Number(right); break;
      case 'lte': result = Number(left) <= Number(right); break;
      case 'contains': result = String(left).includes(String(right)); break;
      case 'truthy': result = !!left; break;
      default: result = !!left;
    }

    return {
      output: { result, left, right, branch: result ? cfg.trueBranch : cfg.falseBranch },
      status: 'completed',
    };
  }

  async _executeTransform(step, context) {
    const { config: cfg = {} } = step;
    const { input, stepOutputs = {} } = context;

    // Apply a mapping from input fields to output fields
    const output = {};
    if (cfg.mapping && typeof cfg.mapping === 'object') {
      for (const [key, path] of Object.entries(cfg.mapping)) {
        output[key] = this._resolve(path, { input, outputs: stepOutputs });
      }
    } else {
      // No mapping, pass through
      Object.assign(output, input);
    }

    // Apply template strings
    if (cfg.template && typeof cfg.template === 'string') {
      output._rendered = cfg.template.replace(/\{\{([^}]+)\}\}/g, (_, path) =>
        String(this._resolve(path.trim(), { input, outputs: stepOutputs }) || '')
      );
    }

    return { output, status: 'completed' };
  }

  async _executeDelay(step, context) {
    const { config: cfg = {} } = step;
    const ms = cfg.durationMs || cfg.duration || 1000;

    if (ms <= 5000) {
      // Short delays can be handled inline
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
    // Long delays should be handled via BullMQ delay, but for simplicity we cap
    return { output: { delayedMs: ms }, status: 'completed' };
  }

  async _executeApproval(step, context) {
    const { config: cfg = {} } = step;
    const { runId, orgId } = context;

    const expiresAt = cfg.expiresInMs
      ? new Date(Date.now() + cfg.expiresInMs)
      : cfg.expiresAt
      ? new Date(cfg.expiresAt)
      : null;

    const approval = await ApprovalRepository.create({
      id: uuidv4(),
      orgId,
      runId,
      stepId: step.id,
      type: cfg.approvalType || 'manual',
      requestedBy: context.triggeredBy || null,
      assignedTo: cfg.assignedTo || [],
      context: { step, input: context.input },
      expiresAt,
    });

    // Signal that the workflow run is now waiting for approval
    return {
      output: { approvalId: approval.id, status: 'pending' },
      status: 'waiting_approval',
    };
  }

  async _executeAiTask(step, context) {
    const { config: cfg = {} } = step;
    const { orgId, runId, input, stepOutputs = {} } = context;

    const payload = {
      ...(cfg.payload || {}),
      ...input,
      ...this._resolvePayload(cfg.inputMapping || {}, { input, outputs: stepOutputs }),
    };

    const result = await AIService.execute({
      orgId,
      runId,
      action: cfg.action || 'summarize',
      payload,
      overrideProvider: cfg.provider,
      overrideModel: cfg.model,
    });

    return { output: result, status: 'completed' };
  }

  async _executeConnectorAction(step, context) {
    const { config: cfg = {} } = step;
    const { orgId, input, stepOutputs = {} } = context;

    if (!cfg.integrationId) throw new Error('connector_action step requires config.integrationId');
    if (!cfg.operation) throw new Error('connector_action step requires config.operation');

    const credentials = await IntegrationService.getCredentials(cfg.integrationId, orgId);
    const integration = await IntegrationService.getById(cfg.integrationId, orgId);

    const ConnectorClass = registry.get(integration.type);
    if (!ConnectorClass) throw new Error(`No connector for type: ${integration.type}`);

    const connector = new ConnectorClass({ credentials, settings: integration.settings });
    await connector.connect();

    const params = {
      ...(cfg.params || {}),
      ...this._resolvePayload(cfg.inputMapping || {}, { input, outputs: stepOutputs }),
    };

    const result = await connector.execute(cfg.operation, params);
    await connector.disconnect();

    return { output: result, status: 'completed' };
  }

  async _executeNotification(step, context) {
    const { config: cfg = {} } = step;
    const { orgId, input, stepOutputs = {} } = context;

    const channel = cfg.channel || 'email';

    if (channel === 'email' && cfg.integrationId) {
      const credentials = await IntegrationService.getCredentials(cfg.integrationId, orgId);
      const integration = await IntegrationService.getById(cfg.integrationId, orgId);
      const EmailConnector = require('../connectors/email/EmailConnector');
      const connector = new EmailConnector({ credentials, settings: integration.settings });
      await connector.connect();
      await connector.execute('send_email', {
        to: cfg.to,
        subject: cfg.subject,
        text: cfg.body,
        html: cfg.htmlBody,
      });
      await connector.disconnect();
      return { output: { sent: true, channel: 'email' }, status: 'completed' };
    }

    if (channel === 'slack' && cfg.integrationId) {
      const credentials = await IntegrationService.getCredentials(cfg.integrationId, orgId);
      const integration = await IntegrationService.getById(cfg.integrationId, orgId);
      const SlackConnector = require('../connectors/slack/SlackConnector');
      const connector = new SlackConnector({ credentials, settings: integration.settings });
      await connector.connect();
      await connector.execute('send_message', {
        channel: cfg.slackChannel || cfg.channel,
        text: cfg.message || cfg.body,
      });
      await connector.disconnect();
      return { output: { sent: true, channel: 'slack' }, status: 'completed' };
    }

    // Log-only notification as fallback
    logger.info({ orgId, stepId: step.id, cfg }, 'Notification step (no integration configured)');
    return { output: { sent: false, channel, reason: 'No integration configured' }, status: 'completed' };
  }

  async _executeSubWorkflow(step, context) {
    const { config: cfg = {} } = step;
    const { orgId, input } = context;

    if (!cfg.workflowId) throw new Error('sub_workflow step requires config.workflowId');

    // Enqueue sub-workflow run
    const WorkflowRunnerService = require('../services/WorkflowRunnerService');
    const run = await WorkflowRunnerService.enqueue(cfg.workflowId, orgId, {
      input: { ...input, ...(cfg.input || {}) },
      triggerType: 'sub_workflow',
      correlationId: context.correlationId,
    });

    return { output: { subRunId: run.id, status: run.status }, status: 'completed' };
  }

  /**
   * Resolve a dotted path like "input.lead.email" or "outputs.step1.result"
   */
  _resolve(path, { input, outputs }) {
    if (!path || typeof path !== 'string') return path;

    const parts = path.split('.');
    let current = { input, outputs };

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }

    return current;
  }

  _resolvePayload(mapping, ctx) {
    const result = {};
    for (const [key, path] of Object.entries(mapping)) {
      result[key] = this._resolve(path, ctx);
    }
    return result;
  }
}

module.exports = new StepExecutor();
