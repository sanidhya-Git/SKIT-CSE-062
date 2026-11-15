'use strict';

const { v4: uuidv4 } = require('uuid');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const { NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

class WorkflowService {
  async list(orgId, opts = {}) {
    return WorkflowRepository.list(orgId, opts);
  }

  async getById(workflowId, orgId) {
    const wf = await WorkflowRepository.findById(workflowId, orgId);
    if (!wf) throw new NotFoundError('Workflow');
    return wf;
  }

  async create({ name, description, trigger, steps, variables }, orgId, userId) {
    const id = uuidv4();
    const workflow = await WorkflowRepository.create({
      id, orgId, name, description, trigger, steps, variables, createdBy: userId,
    });

    // Save version 1
    await WorkflowRepository.saveVersion({
      id: uuidv4(),
      workflowId: id,
      version: 1,
      definition: { name, description, trigger, steps, variables },
      createdBy: userId,
    });

    logger.info({ orgId, workflowId: id, userId, action: 'workflow.create' }, 'Workflow created');
    return workflow;
  }

  async update(workflowId, orgId, updates, userId) {
    const existing = await WorkflowRepository.findById(workflowId, orgId);
    if (!existing) throw new NotFoundError('Workflow');

    if (existing.status === 'archived') {
      throw new ConflictError('Cannot update an archived workflow');
    }

    const newVersion = existing.version + 1;
    const updated = await WorkflowRepository.update(workflowId, orgId, {
      ...updates,
      version: newVersion,
      status: existing.status === 'published' ? 'draft' : existing.status,
    });

    // Save new version snapshot
    await WorkflowRepository.saveVersion({
      id: uuidv4(),
      workflowId,
      version: newVersion,
      definition: {
        name: updated.name,
        description: updated.description,
        trigger: updated.trigger,
        steps: updated.steps,
        variables: updated.variables,
      },
      createdBy: userId,
    });

    logger.info({ orgId, workflowId, userId, version: newVersion, action: 'workflow.update' }, 'Workflow updated');
    return updated;
  }

  async delete(workflowId, orgId) {
    const existing = await WorkflowRepository.findById(workflowId, orgId);
    if (!existing) throw new NotFoundError('Workflow');

    const deleted = await WorkflowRepository.delete(workflowId, orgId);
    if (!deleted) throw new NotFoundError('Workflow');

    logger.info({ orgId, workflowId, action: 'workflow.delete' }, 'Workflow deleted');
    return { deleted: true };
  }

  async publish(workflowId, orgId, userId) {
    const existing = await WorkflowRepository.findById(workflowId, orgId);
    if (!existing) throw new NotFoundError('Workflow');

    if (existing.status === 'archived') {
      throw new ConflictError('Cannot publish an archived workflow');
    }

    const updated = await WorkflowRepository.update(workflowId, orgId, {
      status: 'published',
      publishedAt: new Date(),
    });

    logger.info({ orgId, workflowId, userId, action: 'workflow.publish' }, 'Workflow published');
    return updated;
  }

  async pause(workflowId, orgId, userId) {
    const existing = await WorkflowRepository.findById(workflowId, orgId);
    if (!existing) throw new NotFoundError('Workflow');

    if (existing.status !== 'published') {
      throw new ConflictError('Only published workflows can be paused');
    }

    const updated = await WorkflowRepository.update(workflowId, orgId, { status: 'paused' });
    logger.info({ orgId, workflowId, userId, action: 'workflow.pause' }, 'Workflow paused');
    return updated;
  }

  async getVersions(workflowId, orgId) {
    const existing = await WorkflowRepository.findById(workflowId, orgId);
    if (!existing) throw new NotFoundError('Workflow');
    return WorkflowRepository.getVersions(workflowId, orgId);
  }
}

module.exports = new WorkflowService();
