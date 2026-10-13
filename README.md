# AI Agent Hub · Business Decision Support

AI Agent Hub is an experimental business decision-support tool. Three AI roles work through a business question: Quinn proposes a plan, Delta challenges assumptions and risks, and Sol turns the discussion into practical next steps.

It is intended to help people think through options. It does not guarantee business results, replace professional advice, or make decisions on a customer's behalf.

## Current status

**Prototype / controlled testing. Not yet a production-ready paid service.**

Before accepting public paid customers, the project still needs a verified customer onboarding and delivery flow, clear pricing and terms, customer-specific access controls, usage limits, finalized privacy/retention practices, and end-to-end testing of the live assistant.

## Try the prototype

The public GitHub Pages site is https://ananamousklown777-eng.github.io/Ai-agent-hub/.

The business assistant is intended for controlled demonstrations and testing. If it requests an access key, do not share that key publicly or send it in a support message. Do not enter passwords, payment details, customer personal information, confidential business data, or other secrets.

## Quality checks

The repository includes automated checks for selected quality-policy regressions and deployment/health workflows. Passing automated tests or a backend health endpoint does **not** prove the AI will always give correct answers or establish commercial readiness. Test the full live customer journey before relying on results.

## Setup and operations

1. Review the repository's workflow files and application entry points to identify the currently deployed frontend and backend.
2. Configure required service credentials only in the hosting provider's secret/environment-variable settings. Never commit credentials, tokens, real environment files, or access keys.
3. Deploy the backend using the hosting provider's documented build/start settings and verify its health endpoint.
4. Deploy the frontend using the configured GitHub Pages workflow and test it on both mobile and desktop.
5. Run the repository's GitHub Actions checks after every change.
6. Before any public sale, complete the security, privacy, access-control, rate-limit, pricing, support, and end-to-end acceptance checks listed above.

This repository may also contain a TikTok integration scaffold. It is separate from the current three-agent business decision-support experience; do not assume TikTok integration is complete or approved for production.

## Security

- Never commit or publish API keys, client secrets, access tokens, refresh tokens, passwords, or customer data.
- Store credentials in the hosting provider's encrypted environment/secret settings.
- Use least-privilege credentials and rotate any credential that may have been exposed.
- Avoid collecting sensitive customer information in prompts or logs.

## Limitations

AI-generated plans can be incomplete, outdated, or wrong. Customers must review recommendations and independently verify important financial, legal, regulatory, and operational decisions.
