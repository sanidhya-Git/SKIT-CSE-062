'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('./AIProvider');
const config = require('../config');

// Pricing per million tokens (Gemini 1.5 Flash is free tier / low cost)
const PRICING = {
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 3.5, output: 10.5 },
};

class GeminiProvider extends AIProvider {
  constructor() {
    super('gemini');
    this.defaultModel = 'gemini-1.5-flash';
    this._client = null;
  }

  isAvailable() {
    return !!config.ai.geminiApiKey;
  }

  _getClient() {
    if (!this._client) {
      this._client = new GoogleGenerativeAI(config.ai.geminiApiKey);
    }
    return this._client;
  }

  async complete({ action, prompt, model, payload }) {
    const client = this._getClient();
    const selectedModel = model || this.defaultModel;

    const genModel = client.getGenerativeModel({
      model: selectedModel,
      systemInstruction:
        'You are OneOps AI, an enterprise workflow intelligence assistant. ' +
        'When asked to return JSON, respond with valid JSON only, no explanation or markdown fences.',
    });

    let promptText = prompt;

    if (action === 'chat' && payload?.messages?.length > 0) {
      const history = payload.messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const chat = genModel.startChat({ history });
      const lastMsg = payload.messages[payload.messages.length - 1];
      const result = await chat.sendMessage(lastMsg.content);
      const outputText = result.response.text();

      const usageMeta = result.response.usageMetadata || {};
      const promptTokens = usageMeta.promptTokenCount || 0;
      const completionTokens = usageMeta.candidatesTokenCount || 0;
      const pricing = PRICING[selectedModel] || { input: 0.075, output: 0.30 };
      const costUsd =
        (promptTokens / 1_000_000) * pricing.input +
        (completionTokens / 1_000_000) * pricing.output;

      return { result: { message: outputText }, promptTokens, completionTokens, costUsd };
    }

    const response = await genModel.generateContent(promptText);
    const outputText = response.response.text();
    const usageMeta = response.response.usageMetadata || {};
    const promptTokens = usageMeta.promptTokenCount || 0;
    const completionTokens = usageMeta.candidatesTokenCount || 0;

    const pricing = PRICING[selectedModel] || { input: 0.075, output: 0.30 };
    const costUsd =
      (promptTokens / 1_000_000) * pricing.input +
      (completionTokens / 1_000_000) * pricing.output;

    let result;
    try {
      result = this.parseJson(outputText);
    } catch {
      result = { raw: outputText };
    }

    return { result, promptTokens, completionTokens, costUsd };
  }
}

module.exports = GeminiProvider;
