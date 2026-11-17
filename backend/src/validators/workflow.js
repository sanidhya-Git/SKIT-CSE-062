'use strict';

const { z } = require('zod');

const triggerSchema = z.object({
  type: z.enum(['manual', 'schedule', 'webhook', 'event', 'api']),
  config: z.record(z.unknown()).optional().default({}),
});

const stepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    'condition',
    'transform',
    'delay',
    'approval',
    'ai_task',
    'connector_action',
    'notification',
    'sub_workflow',
  ]),
  config: z.record(z.unknown()).optional().default({}),
  next: z.union([z.string(), z.array(z.string())]).optional(),
  onError: z.enum(['fail', 'skip', 'retry']).optional().default('fail'),
  retries: z.number().int().min(0).max(10).optional().default(0),
  timeoutMs: z.number().int().positive().optional(),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(2000).optional(),
  trigger: triggerSchema,
  steps: z.array(stepSchema).min(1).optional(),
  variables: z.record(z.unknown()).optional().default({}),
});

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  description: z.string().max(2000).optional(),
  trigger: triggerSchema.optional(),
  steps: z.array(stepSchema).min(1).optional(),
  variables: z.record(z.unknown()).optional(),
});

const runWorkflowSchema = z.object({
  input: z.record(z.unknown()).optional().default({}),
  idempotencyKey: z.string().max(255).optional(),
});

module.exports = {
  createWorkflowSchema,
  updateWorkflowSchema,
  runWorkflowSchema,
};
