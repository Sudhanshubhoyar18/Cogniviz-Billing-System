// Vercel Serverless Function entry point for Cogniviz Billing & CRM API
const server = require('../server/dist/index.js');

const app = server.default || server.app || server;

module.exports = app;

