'use strict';

const SalesforceConnector = require('./salesforce/SalesforceConnector');
const GitHubConnector = require('./github/GitHubConnector');
const JiraConnector = require('./jira/JiraConnector');
const SlackConnector = require('./slack/SlackConnector');
const EmailConnector = require('./email/EmailConnector');

const REGISTRY = new Map([
  ['salesforce', SalesforceConnector],
  ['github', GitHubConnector],
  ['jira', JiraConnector],
  ['slack', SlackConnector],
  ['email', EmailConnector],
]);

const registry = {
  get(type) {
    return REGISTRY.get(type) || null;
  },

  has(type) {
    return REGISTRY.has(type);
  },

  listTypes() {
    return Array.from(REGISTRY.keys());
  },

  register(type, ConnectorClass) {
    REGISTRY.set(type, ConnectorClass);
  },
};

module.exports = registry;
