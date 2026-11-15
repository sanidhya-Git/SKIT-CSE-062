'use strict';

const OpenAI = require('openai');
const AIProvider = require('./AIProvider');
const config = require('../config');

// Pricing per million tokens
const PRICING = {
  'gpt-4o': { input: 5.0, output: 15.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
};

class OpenAIProvider extends AIProvider {
  constructor() {
    super('openai');
    this.defaultModel = 'gpt-4o-mini';
    this._client = null;
  }

  isAvailable() {
    return !!config.ai.openaiApiKey;
  }

  _getClient() {
    if (!this._client) {
      this._client = new OpenAI({ apiKey: config.ai.openaiApiKey });
    }
    return this._client;
  }

  async complete({ action, prompt, model, payload }) {
    const client = this._getClient();
    const selectedModel = model || this.defaultModel;

    const messages = [
      {
        role: 'system',
        content:
          'You are OneOps AI, an enterprise workflow intelligence assistant. ' +
          'When asked to return JSON, respond with valid JSON only, no explanation or markdown.',
      },
    ];

    if (action === 'chat' && payload?.messages?.length > 0) {
      for (const msg of payload.messages) {
        messages.push({ role: msg.role, content: msg.content });
      }
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const responseFormat =
      action !== 'chat' ? { type: 'json_object' } : undefined;

    const completion = await client.chat.completions.create({
      model: selectedModel,
      messages,
      max_tokens: 2048,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });

    const outputText = completion.choices?.[0]?.message?.content || '';
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;

    const pricing = PRICING[selectedModel] || { input: 5.0, output: 15.0 };
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

module.exports = OpenAIProvider;
