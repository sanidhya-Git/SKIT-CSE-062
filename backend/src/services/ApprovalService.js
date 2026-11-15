'use strict';

const { v4: uuidv4 } = require('uuid');
const ApprovalRepository = require('../repositories/ApprovalRepository');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

class ApprovalService {
  async list(orgId, opts = {}) {
    return ApprovalRepository.list(orgId, opts);
  }

  async getById(approvalId, orgId) {
    const approval = await ApprovalRepository.findById(approvalId, orgId);
    if (!approval) throw new NotFoundError('Approval request');
    return approval;
  }

  async create({ orgId, runId, stepId, type, requestedBy, assignedTo, context, expiresAt }) {
    const id = uuidv4();
    return ApprovalRepository.create({
      id, orgId, runId, stepId, type, requestedBy, assignedTo, context, expiresAt,
    });
  }

  async approve(approvalId, orgId, userId, { decision }) {
    const approval = await ApprovalRepository.findById(approvalId, orgId);
    if (!approval) throw new NotFoundError('Approval request');

    if (approval.status !== 'pending') {
      throw new ConflictError(`Approval is already ${approval.status}`);
    }

    if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
      throw new ConflictError('Approval request has expired');
    }

    // Check if user is in assigned_to list (if set)
    if (approval.assigned_to && approval.assigned_to.length > 0) {
      if (!approval.assigned_to.includes(userId)) {
        throw new ForbiddenError('You are not authorized to approve this request');
      }
    }

    const updated = await ApprovalRepository.decide(approvalId, orgId, {
      status: 'approved',
      decision: decision || 'approved',
      decidedBy: userId,
    });

    if (!updated) throw new ConflictError('Approval was already decided');

    logger.info({ approvalId, orgId, userId, action: 'approval.approve' }, 'Approval approved');
    return updated;
  }

  async reject(approvalId, orgId, userId, { reason }) {
    const approval = await ApprovalRepository.findById(approvalId, orgId);
    if (!approval) throw new NotFoundError('Approval request');

    if (approval.status !== 'pending') {
      throw new ConflictError(`Approval is already ${approval.status}`);
    }

    if (approval.assigned_to && approval.assigned_to.length > 0) {
      if (!approval.assigned_to.includes(userId)) {
        throw new ForbiddenError('You are not authorized to reject this request');
      }
    }

    const updated = await ApprovalRepository.decide(approvalId, orgId, {
      status: 'rejected',
      decision: null,
      decidedBy: userId,
      reason,
    });

    if (!updated) throw new ConflictError('Approval was already decided');

    logger.info({ approvalId, orgId, userId, action: 'approval.reject' }, 'Approval rejected');
    return updated;
  }
}

module.exports = new ApprovalService();
