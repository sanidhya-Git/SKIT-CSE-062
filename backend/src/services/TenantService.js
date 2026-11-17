'use strict';

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const OrganisationRepository = require('../repositories/OrganisationRepository');
const UserRepository = require('../repositories/UserRepository');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');
const config = require('../config');
const EmailService = require('./EmailService');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

async function uniqueSlug(base) {
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await OrganisationRepository.findBySlug(slug);
    if (!existing) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

class TenantService {
  async createOrganisation({ name }, userId) {
    const base = slugify(name);
    const slug = await uniqueSlug(base);
    const id = uuidv4();

    const org = await OrganisationRepository.create({ id, name, slug, ownerId: userId });
    logger.info({ orgId: id, userId, action: 'org.create' }, 'Organisation created');
    return org;
  }

  async listUserOrgs(userId) {
    return OrganisationRepository.findByUserId(userId);
  }

  async getOrg(orgId) {
    const org = await OrganisationRepository.findById(orgId);
    if (!org) throw new NotFoundError('Organisation');
    return org;
  }

  async updateOrg(orgId, updates) {
    const org = await OrganisationRepository.update(orgId, updates);
    if (!org) throw new NotFoundError('Organisation');
    return org;
  }

  async listMembers(orgId) {
    return OrganisationRepository.getMembers(orgId);
  }

  async inviteMember(orgId, { email, role }, invitedBy) {
    const [org, inviter, user] = await Promise.all([
      OrganisationRepository.findById(orgId),
      UserRepository.findById(invitedBy),
      UserRepository.findByEmail(email),
    ]);

    if (!org) throw new NotFoundError('Organisation');

    // User already has an account — add them directly and notify
    if (user) {
      const existing = await OrganisationRepository.getMember(orgId, user.id);
      if (existing) {
        throw new ConflictError('User is already a member of this organisation');
      }

      const member = await OrganisationRepository.addMember({
        orgId,
        userId: user.id,
        role,
        invitedBy,
      });

      logger.info({ orgId, userId: user.id, role, invitedBy, action: 'member.invite' }, 'Member added');

      // Send notification email (non-blocking)
      EmailService.sendMemberAddedEmail({
        toEmail: user.email,
        orgName: org.name,
        inviterName: inviter?.name || 'A team member',
        role,
      }).catch((err) =>
        logger.warn({ err, toEmail: user.email }, 'Failed to send member-added email')
      );

      return { ...member, inviteType: 'direct' };
    }

    // User doesn't have an account — create a pending invite and email them
    const existingInvite = await OrganisationRepository.findPendingInviteByEmail(orgId, email);
    if (existingInvite) {
      throw new ConflictError('An active invite has already been sent to this email address');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const invite = await OrganisationRepository.createInvite({
      orgId,
      email,
      role,
      token,
      invitedBy,
    });

    logger.info({ orgId, email, role, invitedBy, action: 'member.invite_pending' }, 'Invite created');

    const inviteLink = `${config.frontendUrl}/accept-invite?token=${token}`;

    // Send invite email (non-blocking)
    EmailService.sendInviteEmail({
      toEmail: email,
      orgName: org.name,
      inviterName: inviter?.name || 'A team member',
      inviteLink,
      role,
    }).catch((err) =>
      logger.warn({ err, toEmail: email }, 'Failed to send invite email')
    );

    return { ...invite, inviteType: 'pending' };
  }

  async updateMemberRole(orgId, targetUserId, role, requestingMember) {
    const target = await OrganisationRepository.getMember(orgId, targetUserId);
    if (!target) throw new NotFoundError('Member');

    // Prevent demoting owner unless requester is owner
    if (target.role === 'owner' && requestingMember.role !== 'owner') {
      throw new ForbiddenError('Only the owner can transfer ownership');
    }

    // Prevent promoting to owner unless requester is owner
    if (role === 'owner' && requestingMember.role !== 'owner') {
      throw new ForbiddenError('Only the owner can transfer ownership');
    }

    const updated = await OrganisationRepository.updateMemberRole(orgId, targetUserId, role);
    if (!updated) throw new NotFoundError('Member');
    return updated;
  }

  async removeMember(orgId, targetUserId, requestingMember) {
    const target = await OrganisationRepository.getMember(orgId, targetUserId);
    if (!target) throw new NotFoundError('Member');

    if (target.role === 'owner') {
      throw new ForbiddenError('Cannot remove the owner from the organisation');
    }

    // Members can remove themselves; admins/owners can remove others
    const isSelf = requestingMember.userId === targetUserId;
    if (!isSelf && !['owner', 'admin'].includes(requestingMember.role)) {
      throw new ForbiddenError('Insufficient permissions to remove this member');
    }

    await OrganisationRepository.removeMember(orgId, targetUserId);
    logger.info({ orgId, targetUserId, action: 'member.remove' }, 'Member removed');
  }
}

module.exports = new TenantService();
