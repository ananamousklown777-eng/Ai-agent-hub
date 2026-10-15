# Breeze Web Agent

Breeze Web Agent is an early, separate browser-automation MVP for AI Agent Hub. It uses Playwright to open a public webpage, collect its title and readable text, list links, and capture a screenshot.

## Current scope

- Browser-based page inspection through a simple web interface
- JSON API: `POST /api/inspect`
- Health endpoint: `GET /health`
- Basic request throttling and private-network URL blocking
- No account system, billing, saved sessions, or customer credentials yet

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npx playwright install chromium
npm start
```

Open http://localhost:3000.

## Deploying

This app is intended to deploy as its own service from the `breeze-web-agent` directory, not as part of the Breeze Live service. Set the service's root directory to `breeze-web-agent`. Use the build command `npm install && npx playwright install --with-deps chromium` and start command `npm start`.

Browser hosting has resource limits. Test on a free instance before inviting anyone else to use it.

## Safety and production status

This is a prototype, not a production-ready public service. Do not use it for passwords, private accounts, sensitive data, or high-risk actions. Before public launch, add strong authentication, durable rate limits, job limits, audit logs, isolation, abuse monitoring, privacy terms, and a usage-cost model. Network blocking is defense-in-depth, not a guarantee against every SSRF or browser escape scenario.

Do not commit API keys, session cookies, customer data, or credentials.
