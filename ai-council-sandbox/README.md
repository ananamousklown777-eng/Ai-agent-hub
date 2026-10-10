# AI Council Sandbox

A separate three-agent prototype for testing the Council before scaling toward 705 logical agents. It does not modify Breeze Live.

## The three agents

- **Quinn** prepares an answer using the supplied question and evidence.
- **Delta** challenges the answer, flags unsupported claims, and looks for gaps.
- **Sol** combines both responses into a final summary and identifies uncertainty.

These are software roles run by an AI model, not separate conscious beings.

## Deploy the Council API on Render

This API is designed to be deployed as a **separate service**, not as part of Breeze Live.

- **Root Directory:** `ai-council-sandbox`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** Node
- **Node version:** 20 or newer

Add these environment variables in the new Render service's Environment settings:

- `GROQ_API_KEY` = your private Groq API key
- `COUNCIL_ACCESS_KEY` = a new, long random password that you create for protecting the Council endpoint
- `GROQ_MODEL` = optional; default is `openai/gpt-oss-20b`

Never paste either secret into chat or commit it to GitHub. Do not reuse your Groq key as the Council access password.

After deployment, open the service URL plus `/health`. A healthy response should show `ok: true` and `configured: true`.

The protected endpoint is `POST /council`. Send JSON with a `question` and optional `urls` array (up to three HTTPS webpages), and include your Council password in the `x-council-key` request header. The endpoint runs Quinn, then Delta, then Sol and returns all three responses. The health endpoint does not reveal secrets.

## Local runner

The separate command-line runner uses Groq's chat-completions API. Set `GROQ_API_KEY` as an environment variable, then run:

```sh
npm run council -- "What are the main claims and weaknesses of this article?" https://example.com
```

You can supply more than one HTTPS page URL after the question. It does not automatically search the web; you supply the pages to inspect.

## Current limitations

- This is an experimental prototype, not a continuously running group of conscious agents.
- The Council API requires a provider key and internet access from the deployed server.
- Webpage fetching uses basic safeguards but is not a hardened security boundary. Treat outputs as unverified and do not send sensitive data.
- Groq Free access has rate limits; requests may be rejected when limits are reached. Check Groq's current rate-limit documentation for your account.
- Test with three agents before scaling. For a larger Council, use a controlled worker queue rather than launching 705 processes at once.
