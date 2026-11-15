'use strict';

/**
 * Abstract base class for all integration connectors.
 * Subclasses must implement: connect(), test(), execute(operation, params), disconnect()
 */
class ConnectorAdapter {
  constructor({ credentials = {}, settings = {} } = {}) {
    if (new.target === ConnectorAdapter) {
      throw new Error('ConnectorAdapter is abstract and cannot be instantiated directly');
    }
    this.credentials = credentials;
    this.settings = settings;
    this.connected = false;
  }

  /**
   * Establish connection / initialize client
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error(`${this.constructor.name}.connect() not implemented`);
  }

  /**
   * Verify the connection is working (ping / auth check)
   * @returns {Promise<{ ok: boolean, details?: object }>}
   */
  async test() {
    throw new Error(`${this.constructor.name}.test() not implemented`);
  }

  /**
   * Execute a named operation with parameters
   * @param {string} operation  e.g. 'query_leads', 'send_message'
   * @param {object} params     Operation-specific parameters
   * @returns {Promise<any>}
   */
  async execute(operation, params = {}) {
    throw new Error(`${this.constructor.name}.execute() not implemented`);
  }

  /**
   * Clean up connections / release resources
   * @returns {Promise<void>}
   */
  async disconnect() {
    this.connected = false;
  }

  /**
   * Returns list of supported operation names
   * @returns {string[]}
   */
  supportedOperations() {
    throw new Error(`${this.constructor.name}.supportedOperations() not implemented`);
  }

  /**
   * Validate that an operation is supported
   */
  _assertOperation(operation) {
    const ops = this.supportedOperations();
    if (!ops.includes(operation)) {
      throw new Error(
        `Operation "${operation}" is not supported by ${this.constructor.name}. ` +
        `Supported: ${ops.join(', ')}`
      );
    }
  }
}

module.exports = ConnectorAdapter;
