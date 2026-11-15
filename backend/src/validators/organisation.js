'use strict';

const { z } = require('zod');

const ROLES = ['owner', 'admin', 'builder', 'approver', 'operator', 'auditor'];

const createOrgSchema = z.object({
  name: z.string().min(1).max(255).trim(),
});

const updateOrgSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  settings: z.record(z.unknown()).optional(),
  plan: z.enum(['free', 'pro', 'enterprise']).optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  role: z.enum(ROLES),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(ROLES),
});

module.exports = {
  createOrgSchema,
  updateOrgSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
};
