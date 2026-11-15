'use strict';

const { z } = require('zod');

const SUPPORTED_ACTIONS = [
  'score_lead',
  'chat',
  'generate_email',
  'analyse_ticket',
  'summarize',
  'predict',
  'vendor_scorecard',
  'suggest_workflow',
  'reorder_suggestions',
  'project_health',
  'sales_forecast',
  'win_probability',
];

const aiRequestSchema = z
  .object({
    action: z.enum(SUPPORTED_ACTIONS),
    // chat
    messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
    // score_lead / win_probability
    lead: z.record(z.unknown()).optional(),
    opportunity: z.record(z.unknown()).optional(),
    // generate_email
    context: z.record(z.unknown()).optional(),
    tone: z.string().optional(),
    recipient: z.string().optional(),
    // analyse_ticket / summarize
    text: z.string().optional(),
    ticket: z.record(z.unknown()).optional(),
    // predict / sales_forecast
    data: z.unknown().optional(),
    // vendor_scorecard
    vendors: z.array(z.record(z.unknown())).optional(),
    criteria: z.array(z.string()).optional(),
    // suggest_workflow / reorder_suggestions
    description: z.string().optional(),
    suggestions: z.array(z.unknown()).optional(),
    // project_health
    project: z.record(z.unknown()).optional(),
    // generic extra payload
    payload: z.record(z.unknown()).optional(),
    // provider override
    provider: z.enum(['anthropic', 'openai', 'gemini']).optional(),
    model: z.string().optional(),
  })
  .passthrough();

module.exports = { aiRequestSchema, SUPPORTED_ACTIONS };
