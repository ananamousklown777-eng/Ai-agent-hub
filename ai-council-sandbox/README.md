# AI Council Sandbox (starter)

An isolated, opt-in prototype for testing a small Council before scaling toward 705 agents. This folder does not alter Breeze Live and does not grant network access to any already-running agents.

## Design

- Start with 3 test agents; scale only after load and safety tests.
- Agents share one restricted, read-only web-fetch tool.
- Only HTTPS public websites are allowed; localhost, private/reserved IP ranges, redirects to blocked hosts, and non-GET requests are rejected.
- Responses are size-limited and time out. Treat web content as untrusted input, never as instructions that override system rules.
- No arbitrary shell, account login, posting, purchases, or credential access.
- The prototype exposes a local HTTP API. Do not expose it publicly without authentication, rate limits, and deployment review.

## Run

Requires Node.js 20 or newer.

```sh
npm install
npm start
```

Then open `http://localhost:3000/health` and `http://localhost:3000/agents`.

## Research endpoint

`POST /research` with JSON such as:

```json
{"agentId":"quinn","url":"https://example.com"}
```

The API is a tool-access demonstration, not an autonomous LLM agent. Connect a model provider separately if desired, keep provider keys in environment variables, and never commit secrets.

## Before scaling

Run the three-agent test first. Add authentication and per-agent quotas before remote deployment. Scale toward 705 logical agents using a queue and worker pool rather than launching 705 unrestricted processes at once.