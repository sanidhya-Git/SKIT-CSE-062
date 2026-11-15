'use strict';

const { v4: uuidv4 } = require('uuid');
const { query } = require('../db/pool');
const config = require('../config');
const logger = require('../utils/logger');
const { ServiceUnavailableError, InternalError } = require('../utils/errors');

const OpenAIProvider = require('../providers/OpenAIProvider');
const ClaudeProvider = require('../providers/ClaudeProvider');
const GeminiProvider = require('../providers/GeminiProvider');

const PROVIDER_MAP = {
  openai: OpenAIProvider,
  anthropic: ClaudeProvider,
  gemini: GeminiProvider,
};

class AIService {
  _getProviders(overrideProvider) {
    const order = overrideProvider
      ? [overrideProvider, ...config.ai.providerOrder.filter((p) => p !== overrideProvider)]
      : config.ai.providerOrder;

    return order
      .map((name) => {
        const ProviderClass = PROVIDER_MAP[name];
        if (!ProviderClass) return null;
        try {
          const provider = new ProviderClass();
          if (!provider.isAvailable()) return null;
          return { name, provider };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  async execute({ orgId, runId, action, payload, overrideProvider, overrideModel }) {
    const providers = this._getProviders(overrideProvider);

    if (providers.length === 0) {
      throw new ServiceUnavailableError('No AI providers available. Check API keys in configuration.');
    }

    const prompt = this._buildPrompt(action, payload);
    let lastError;

    for (const { name, provider } of providers) {
      const start = Date.now();
      let success = false;
      let result = null;
      let promptTokens = 0;
      let completionTokens = 0;
      let costUsd = null;
      let errorMsg = null;

      try {
        const response = await provider.complete({
          action,
          prompt,
          model: overrideModel,
          payload,
        });

        result = response.result;
        promptTokens = response.promptTokens || 0;
        completionTokens = response.completionTokens || 0;
        costUsd = response.costUsd || null;
        success = true;

        logger.info({ orgId, action, provider: name, promptTokens, completionTokens }, 'AI request completed');
      } catch (err) {
        lastError = err;
        errorMsg = err.message;
        logger.warn({ orgId, action, provider: name, error: err.message }, 'AI provider failed, trying next');
      } finally {
        const latencyMs = Date.now() - start;
        await this._recordRequest({
          orgId,
          runId,
          action,
          provider: name,
          model: overrideModel || provider.defaultModel,
          promptTokens,
          completionTokens,
          costUsd,
          latencyMs,
          success,
          error: errorMsg,
        });
      }

      if (success) {
        return { action, result, provider: name };
      }
    }

    throw new ServiceUnavailableError(
      `All AI providers failed for action "${action}". Last error: ${lastError?.message || 'unknown'}`
    );
  }

  _buildPrompt(action, payload) {
    const prompts = {
      score_lead: () => {
        const lead = payload.lead || payload;
        return `Score this sales lead from 0-100. Provide a JSON response with: score (number), grade (A/B/C/D/F), reasoning (string), top_factors (string[]).
Lead data: ${JSON.stringify(lead)}`;
      },
      chat: () => {
        const messages = payload.messages || [];
        const last = messages[messages.length - 1];
        return last?.content || payload.text || payload.query || 'Hello';
      },
      generate_email: () => {
        return `Generate a professional email. Context: ${JSON.stringify(payload.context || payload)}.
Tone: ${payload.tone || 'professional'}. Recipient: ${payload.recipient || 'unknown'}.
Return JSON: { subject, body, preview_text }`;
      },
      analyse_ticket: () => {
        const ticket = payload.ticket || payload;
        return `Analyse this support ticket and return JSON: { priority (low/medium/high/critical), category (string), sentiment (positive/neutral/negative), summary (string), suggested_actions (string[]) }.
Ticket: ${JSON.stringify(ticket)}`;
      },
      summarize: () => {
        return `Summarise the following text concisely. Return JSON: { summary, key_points (string[]), word_count }.
Text: ${payload.text || JSON.stringify(payload)}`;
      },
      predict: () => {
        return `Analyse the following data and provide predictions. Return JSON: { predictions (array), confidence (0-1), methodology (string) }.
Data: ${JSON.stringify(payload.data || payload)}`;
      },
      vendor_scorecard: () => {
        const vendors = payload.vendors || [];
        const criteria = payload.criteria || ['cost', 'quality', 'reliability', 'support'];
        return `Create a vendor scorecard. Criteria: ${criteria.join(', ')}.
Vendors: ${JSON.stringify(vendors)}.
Return JSON: { scores (array of { vendor, scores: {criterion: score}, total }), recommendation (string) }`;
      },
      suggest_workflow: () => {
        return `Suggest an automation workflow for: "${payload.description || JSON.stringify(payload)}".
Return JSON: { name, description, steps (array of { name, type, description }), estimated_time_saving }`;
      },
      reorder_suggestions: () => {
        return `Reorder these suggestions by relevance and priority: ${JSON.stringify(payload.suggestions || [])}.
Return JSON: { reordered (array with same items), reasoning }`;
      },
      project_health: () => {
        return `Assess the health of this project. Return JSON: { health_score (0-100), status (healthy/at_risk/critical), risks (string[]), recommendations (string[]) }.
Project data: ${JSON.stringify(payload.project || payload)}`;
      },
      sales_forecast: () => {
        return `Generate a sales forecast. Return JSON: { forecast (array of { period, amount, confidence }), total, growth_rate, assumptions (string[]) }.
Data: ${JSON.stringify(payload.data || payload)}`;
      },
      win_probability: () => {
        return `Calculate win probability for this opportunity. Return JSON: { probability (0-1), factors (string[]), next_steps (string[]) }.
Opportunity: ${JSON.stringify(payload.opportunity || payload)}`;
      },
    };

    const builder = prompts[action];
    return builder ? builder() : `Perform action "${action}" on: ${JSON.stringify(payload)}`;
  }

  async _recordRequest({ orgId, runId, action, provider, model, promptTokens, completionTokens, costUsd, latencyMs, success, error }) {
    try {
      await query(
        `INSERT INTO ai_requests (id, org_id, run_id, action, provider, model, prompt_tokens, completion_tokens, cost_usd, latency_ms, success, error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [uuidv4(), orgId, runId || null, action, provider, model || null,
         promptTokens, completionTokens, costUsd, latencyMs, success, error || null]
      );
    } catch (err) {
      logger.error({ err }, 'Failed to record AI request');
    }
  }

  async getUsage(orgId) {
    const result = await query(
      `SELECT action, provider, COUNT(*) AS requests,
              SUM(prompt_tokens) AS total_prompt_tokens,
              SUM(completion_tokens) AS total_completion_tokens,
              SUM(cost_usd) AS total_cost_usd,
              AVG(latency_ms)::INT AS avg_latency_ms,
              COUNT(*) FILTER (WHERE success = TRUE) AS successes
       FROM ai_requests
       WHERE org_id = $1
       GROUP BY action, provider
       ORDER BY total_cost_usd DESC NULLS LAST`,
      [orgId]
    );
    return result.rows;
  }
}

module.exports = new AIService();
