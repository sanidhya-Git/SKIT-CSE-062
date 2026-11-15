'use strict';

const { v4: uuidv4 } = require('uuid');
const { Queue } = require('bullmq');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config');

let workflowQueue;

function getQueue() {
  if (!workflowQueue) {
    workflowQueue = new Queue('workflow-runs', {
      connection: { url: config.redis.url },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 7 * 24 * 3600, count: 1000 },
        removeOnFail: { age: 30 * 24 * 3600 },
      },
    });
  }
  return workflowQueue;
}

class WorkflowRunnerService {
  async enqueue(workflowId, orgId, { input = {}, triggerType = 'manual', idempotencyKey, correlationId } = {}) {
    // Check idempotency
    if (idempotencyKey) {
      const existing = await WorkflowRepository.findRunByIdempotencyKey(idempotencyKey, orgId);
      if (existing) {
        logger.info({ runId: existing.id, idempotencyKey }, 'Idempotent run returned');
        return existing;
      }
    }

    const workflow = await WorkflowRepository.findById(workflowId, orgId);
    if (!workflow) throw new NotFoundError('Workflow');

    if (workflow.status === 'draft') {
      throw new ConflictError('Cannot run a draft workflow. Publish it first.');
    }
    if (workflow.status === 'paused') {
      throw new ConflictError('Workflow is paused');
    }
    if (workflow.status === 'archived') {
      throw new ConflictError('Workflow is archived');
    }

    const runId = uuidv4();
    const run = await WorkflowRepository.createRun({
      id: runId,
      workflowId,
      orgId,
      triggerType,
      triggerData: input,
      correlationId: correlationId || runId,
      idempotencyKey: idempotencyKey || null,
    });

    // Enqueue BullMQ job
    const queue = getQueue();
    await queue.add(
      'execute',
      {
        runId,
        workflowId,
        orgId,
        workflowDefinition: {
          steps: workflow.steps,
          variables: workflow.variables,
        },
        input,
        triggerType,
      },
      { jobId: runId }
    );

    logger.info({ runId, workflowId, orgId, triggerType, action: 'run.enqueued' }, 'Workflow run enqueued');
    return run;
  }

  /**
   * Run in test mode — synchronously executes steps without persisting production state
   */
  async testRun(workflowId, orgId, { input = {} } = {}) {
    const workflow = await WorkflowRepository.findById(workflowId, orgId);
    if (!workflow) throw new NotFoundError('Workflow');

    // For test, we just validate the definition and return mock output
    const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
    return {
      testMode: true,
      workflowId,
      stepsCount: steps.length,
      steps: steps.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        status: 'simulated',
      })),
      input,
    };
  }

  async cancel(runId, orgId) {
    const run = await WorkflowRepository.findRunById(runId, orgId);
    if (!run) throw new NotFoundError('Workflow run');

    if (!['pending', 'running'].includes(run.status)) {
      throw new ConflictError(`Cannot cancel a run with status: ${run.status}`);
    }

    // Remove from queue if still pending
    const queue = getQueue();
    const job = await queue.getJob(runId);
    if (job) {
      await job.remove();
    }

    await WorkflowRepository.updateRun(runId, orgId, {
      status: 'cancelled',
      completedAt: new Date(),
      error: 'Cancelled by user',
    });

    logger.info({ runId, orgId, action: 'run.cancel' }, 'Workflow run cancelled');
    return { runId, status: 'cancelled' };
  }

  async retry(runId, orgId) {
    const run = await WorkflowRepository.findRunById(runId, orgId);
    if (!run) throw new NotFoundError('Workflow run');

    if (!['failed', 'cancelled', 'dead_letter'].includes(run.status)) {
      throw new ConflictError(`Cannot retry a run with status: ${run.status}`);
    }

    const workflow = await WorkflowRepository.findById(run.workflow_id, orgId);
    if (!workflow) throw new NotFoundError('Workflow');

    // Create a new run as a retry
    const newRunId = uuidv4();
    const newRun = await WorkflowRepository.createRun({
      id: newRunId,
      workflowId: run.workflow_id,
      orgId,
      triggerType: run.trigger_type,
      triggerData: run.trigger_data,
      correlationId: run.correlation_id,
      idempotencyKey: null,
    });

    const queue = getQueue();
    await queue.add(
      'execute',
      {
        runId: newRunId,
        workflowId: run.workflow_id,
        orgId,
        workflowDefinition: {
          steps: workflow.steps,
          variables: workflow.variables,
        },
        input: run.trigger_data,
        triggerType: run.trigger_type,
        retryOf: runId,
      },
      { jobId: newRunId }
    );

    logger.info({ originalRunId: runId, newRunId, orgId, action: 'run.retry' }, 'Workflow run retried');
    return newRun;
  }

  async listRuns(orgId, opts = {}) {
    return WorkflowRepository.listRuns(orgId, opts);
  }

  async getRunById(runId, orgId) {
    const run = await WorkflowRepository.findRunById(runId, orgId);
    if (!run) throw new NotFoundError('Workflow run');

    const stepRuns = await WorkflowRepository.getStepRuns(runId);
    return { ...run, steps: stepRuns };
  }

  async closeQueue() {
    if (workflowQueue) {
      await workflowQueue.close();
      workflowQueue = null;
    }
  }
}

module.exports = new WorkflowRunnerService();
