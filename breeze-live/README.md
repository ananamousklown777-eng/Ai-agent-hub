# Breeze Live

Breeze Live is the AI Agent Hub prototype for a future live conversational host.

## Current prototype

- `index.html` provides the mobile-friendly host interface and audience chat simulation.
- No API keys or TikTok credentials are stored in browser code.
- The current response is a placeholder while the secure AI backend is added.

## Architecture

Viewer message -> secure AI backend -> AI response -> text-to-speech -> Breeze live presentation

The browser should call our own backend. Provider secrets must remain server-side and must never be committed to GitHub.

## Next integration steps

1. Add a server endpoint for audience messages.
2. Add server-side AI model configuration through environment variables.
3. Add text-to-speech through a server-side provider.
4. Add a real-time transport layer for low-latency conversation.
5. Add the video/stream output layer.
6. Test the complete flow locally and in a controlled environment.
7. Only then connect any approved TikTok capability.

## Security

Never commit:

- AI provider API keys
- TikTok client secrets
- OAuth access tokens
- Refresh tokens

Use environment variables or the deployment platform's secret manager instead.
