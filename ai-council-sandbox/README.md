# AI Council Sandbox

A separate three-agent prototype for testing the Council before scaling toward 705 logical agents. It does not modify Breeze Live.

## The three agents

- **Quinn** researches the supplied web pages and extracts relevant evidence.
- **Delta** challenges the reasoning, flags unsupported claims, and looks for gaps.
- **Sol** combines their work into a final answer and identifies uncertainty.

These are software roles run by an AI model, not separate conscious beings.

## Run the local API

Requires Node.js 20 or newer:

```sh
npm install
npm start
```

The API listens on `http://127.0.0.1:3000` and provides `/health`, `/agents`, and `POST /research`.

## Run the AI Council

The runner uses Groq's OpenAI-compatible chat-completions endpoint. You need a working Groq API key and available model access; API usage may have limits or costs depending on your account. Never paste a key into source code or commit it to GitHub.

Set `GROQ_API_KEY` as an environment variable, then run:

```sh
npm run council -- "What are the main claims and weaknesses of this article?" https://example.com
```

You can supply more than one HTTPS page URL after the question. Example:

```sh
npm run council -- "Compare the evidence on this topic" https://example.com https://www.iana.org/domains/reserved
```

Optional model override: set `GROQ_MODEL` to a model available to your account. The default is `llama-3.3-70b-versatile`.

The runner passes the same supplied page evidence to Quinn and Delta, then gives both reviews to Sol. It does not automatically search the web for URLs; for now, you supply the pages to inspect. Page content is treated as untrusted data, and the runner only makes read-only webpage requests.

## Current limitations

- This is a small prototype, not a deployed service or a continuously running group of agents.
- The model runner requires a provider API key and internet access from the machine running it.
- The URL fetcher has basic checks but is not a hardened security boundary. Do not expose this prototype publicly or use it to access sensitive systems.
- Test with three agents before scaling. For a larger Council, use a controlled worker queue rather than launching 705 processes at once.
