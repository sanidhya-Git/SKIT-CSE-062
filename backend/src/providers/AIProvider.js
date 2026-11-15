'use strict';

/**
 * Abstract base class for AI providers.
 * All providers must implement:
 *   - isAvailable() → boolean
 *   - complete({ action, prompt, model, payload }) → { result, promptTokens, completionTokens, costUsd }
 */
class AIProvider {
  constructor(name) {
    if (new.target === AIProvider) {
      throw new Error('AIProvider is abstract and cannot be instantiated directly');
    }
    this.name = name;
    this.defaultModel = null;
  }

  /**
   * Returns true if this provider can be used (API key present, etc.)
   */
  isAvailable() {
    throw new Error(`${this.constructor.name}.isAvailable() not implemented`);
  }

  /**
   * Execute a completion request.
   * @param {object} opts
   * @param {string} opts.action     The AI action name
   * @param {string} opts.prompt     Fully-formed prompt string
   * @param {string} [opts.model]    Optional model override
   * @param {object} [opts.payload]  Original request payload (for chat history etc.)
   * @returns {Promise<{ result: any, promptTokens: number, completionTokens: number, costUsd: number }>}
   */
  async complete(opts) {
    throw new Error(`${this.constructor.name}.complete() not implemented`);
  }

  /**
   * Parse JSON from an LLM response string safely.
   * Strips markdown code fences, then parses.
   */
  parseJson(text) {
    if (!text) return null;
    // Remove code fences
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    return JSON.parse(stripped);
  }
}

module.exports = AIProvider;
