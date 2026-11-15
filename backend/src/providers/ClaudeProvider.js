'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const AIProvider = require('./AIProvider');
const config = require('../config');
const logger = require('../utils/logger');

// Cost per million tokens (as of latest Anthropic pricing)
const PRICING = {
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
};

class ClaudeProvider extends AIProvider {
  constructor() {
    super('anthropic');
    this.defaultModel = 'claude-3-5-haiku-20241022';
    this._client = null;
  }

  isAvailable() {
    return !!config.ai.anthropicApiKey;
  }

  _getClient() {
    if (!this._client) {
      this._client = new Anthropic({ apiKey: config.ai.anthropicApiKey });
    }
    return this._client;
  }

  async complete({ action, prompt, model, payload }) {
    const client = this._getClient();
    const selectedModel = model || this.defaultModel;

    const messages = [];

    // For chat action, use the full message history
    if (action === 'chat' && payload?.messages?.length > 0) {
      for (const msg of payload.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const response = await client.messages.create({
      model: selectedModel,
      max_tokens: 2048,
      system:
        'You are OneOps AI, an enterprise workflow intelligence assistant. ' +
        'When asked to return JSON, respond with valid JSON only, no explanation.',
      messages,
    });

    const outputText = response.content?.[0]?.text || '';
    const promptTokens = response.usage?.input_tokens || 0;
    const completionTokens = response.usage?.output_tokens || 0;

    const pricing = PRICING[selectedModel] || { input: 3.0, output: 15.0 };
    const costUsd =
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output;

    let result;
    if (action === 'chat') {
      result = { message: outputText };
    } else {
      try {
        result = this.parseJson(outputText);
      } catch {
        result = { raw: outputText };
      }
    }

    return { result, promptTokens, completionTokens, costUsd };
  }
}

module.exports = ClaudeProvider;
