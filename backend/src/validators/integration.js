'use strict';

const { z } = require('zod');

const INTEGRATION_TYPES = [
  'salesforce',
  'github',
  'jira',
  'slack',
  'email',
  'hubspot',
  'zendesk',
  'custom',
];

const createIntegrationSchema = z.object({
  type: z.enum(INTEGRATION_TYPES),
  name: z.string().min(1).max(255).trim(),
  credentials: z.record(z.unknown()).default({}),
  settings: z.record(z.unknown()).optional().default({}),
});

module.exports = { createIntegrationSchema };
