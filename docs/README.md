# Hush Companion · Documentation

Learn how Hush Companion works, how to configure it, and how to describe the project accurately.

## What is Hush Companion?

Hush Companion is a local-first, voice-first companion for thinking out loud. It gives people a calm space to speak, reflect, practice a conversation, explore a topic, or take a short non-clinical wellness check-in.

Hush Companion is an open-source prototype—not a therapist, medical service, crisis counselor, or emergency service. AI responses can be inaccurate, incomplete, or unsuitable.

## Why Hush Companion exists

Hush Companion was created to give people a small, calm space to speak without needing to type, perform, or organize their thoughts first. Sometimes people need to talk through a difficult moment, test a decision, learn about a topic, or reset during a busy day—but support is not always available at that exact moment.

The project exists to explore a more human-feeling voice interface while keeping the user in control. Hush Companion favors simple conversations, local-first choices, transparent AI boundaries, and an open codebase that people can inspect and improve.

Hush Companion is not intended to replace human relationships or professional care. It is a tool for reflection, practice, curiosity, and making a little room to breathe.

## Who we are

Hush Companion is an independent open-source project maintained by **devkdas**. The project is built around a simple idea: voice AI should be approachable, privacy-conscious, and honest about its limitations.

We are building Hush Companion in public so developers and users can understand how it works, choose between local Ollama and bring-your-own-key Google Gemini, contribute improvements, and adapt the project for their own needs. Feedback, collaboration, deployment requests, and responsible product ideas are welcome through [GitHub](https://github.com/devkdas) or [hello.hushcompanion@gmail.com](mailto:hello.hushcompanion@gmail.com).

## Features

- **Vent** — speak freely and receive supportive reflections.
- **Debate** — test an idea, prepare for a difficult conversation, or practice an argument.
- **Listen** — choose a topic and hear a spoken overview.
- **Wellness check-in** — reflect, ground your attention, reset during the workday, or choose one healthy next step.
- **Voice-first interaction** — use browser speech recognition and speech synthesis where supported.
- **AI provider choice** — use Google Gemini with your own key or run Ollama locally.
- **Optional local voice** — use Kokoro text-to-speech, with browser speech as a fallback.
- **Local transcript downloads** — save a conversation as a text file from the browser.
- **No account required** — the open-source version has no login, payment wall, or subscription system.
- **Light and dark themes** — use the interface comfortably across environments.
- **Mobile starter** — an Expo starter is available in [`apps/mobile`](../apps/mobile).

## Brand assets

- [Square Hush Companion avatar](hush-avatar.svg) for GitHub, Gmail, and profile images.
- [Horizontal Hush Companion logo](hush-companion-logo.svg) for websites, README files, and marketing materials.

Export the SVG assets to PNG when a platform does not accept SVG uploads.

## Quick start

From the repository root:

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. You can explore the interface without an AI provider because Hush Companion includes a local fallback response.

## Configure AI providers

Open **AI settings** in the Hush Companion header.

### Google Gemini

1. Create a key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Select **Google Gemini** in Hush Companion AI settings.
3. Paste the key and save it.
4. Choose a Gemini model, such as `gemini-2.5-flash`.

Gemini requests go directly from the browser to Google. The key is saved in that browser's `localStorage`; it is not sent to the optional Hush Companion API proxy or committed to the repository.

A browser-supplied key is not a true secret. Browser extensions, shared computers, developer tools, or local malware may expose it. Restrict and monitor the key where possible, avoid sharing sensitive information, and revoke it if exposed. For a hosted multi-user product, use server-side secret management instead of shipping a provider key to browser code.

References:

- [Gemini API documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini API reference](https://ai.google.dev/api)
- [Google AI Studio API keys](https://aistudio.google.com/app/apikey)
- [Gemini troubleshooting](https://ai.google.dev/gemini-api/docs/troubleshooting)

### Ollama

Choose **Ollama** in AI settings and run a local Ollama server. Hush Companion does not require an API key for local Ollama.

```bash
VITE_API_URL=http://localhost:11434
VITE_OLLAMA_MODEL=gemma3:4b
# Optional Kokoro/API proxy URL; leave unset to use browser speech.
VITE_TTS_URL=
```

See the [Ollama documentation](https://docs.ollama.com/).

## Optional services

### Kokoro text-to-speech

The local voice server is in `voice-server/` and provides optional Kokoro speech generation. Set `VITE_TTS_URL=http://localhost:8000` to use it; if `VITE_TTS_URL` is unset, Hush Companion uses browser speech synthesis without probing port 8000.

```bash
python3.12 -m venv .venv-kokoro
source .venv-kokoro/bin/activate
pip install -r voice-server/requirements.txt
python -m uvicorn voice-server.tts_server:app --host 127.0.0.1 --port 8000
```

Read the [Kokoro model information](https://huggingface.co/hexgrad/Kokoro-82M).

### Local API proxy

The optional Fastify proxy in `api-server/` forwards local Ollama and Kokoro requests. It does not handle accounts, billing, or Gemini keys.

```bash
cd api-server
npm install
cp .env.example .env
npm run dev
```

Do not expose this unauthenticated local proxy to the public internet. Add authentication, access controls, and rate limits before any public deployment.

## Architecture

```text
Browser / React + Vite
  ├─ Conversation state in browser memory
  ├─ Google Gemini directly from the browser (user-supplied key)
  ├─ Ollama directly or through the optional Fastify proxy
  ├─ Kokoro through the local voice service
  └─ Browser speech recognition and synthesis fallbacks

Optional Fastify API proxy
  ├─ /api/chat → Ollama
  └─ /api/tts  → Kokoro
```

Hush Companion does not currently maintain a user database, account system, tenant system, server-side conversation history, or hosted billing system.

## Privacy and safety

- Conversation state is held in browser memory and is lost when the page is refreshed.
- Transcript downloads are created locally by the browser.
- Theme and AI settings are stored in browser `localStorage`.
- Gemini message text is sent directly to Google when Gemini is selected.
- Ollama message text is sent to the configured Ollama URL.
- User-entered Gemini keys are not included in transcript exports.
- Avoid passwords, financial information, identifying information, and other sensitive data.
- Do not use Hush Companion for diagnosis, treatment, urgent safety decisions, or emergencies.

See the in-app **Privacy** and **AI disclaimer** panels before using Hush Companion with real personal information.

## Wellness check-in

Wellness check-in is intentionally non-clinical. It supports mood reflection, grounding, breathing, workday resets, journaling, preparing for difficult conversations, and identifying one practical next step.

Use terms such as **wellness check-in**, **workday reset**, **reflect**, or **mindful pause**. Do not market it as mental-health treatment, therapy, diagnosis, medical advice, crisis counseling, or emergency support.

Read the [corporate wellness direction](corporate-wellness.md) for future workplace product ideas and privacy requirements. For cold-email templates, recipient roles, ethical contact-finding guidance, and logo usage, see the [corporate outreach guide](corporate-outreach.md).

## Marketing and positioning

### Core message

> **Hush Companion is a private voice companion for thinking out loud.**

### Product description

> Talk it out, think it through, or simply listen. Hush Companion creates a calm, voice-first space for reflection, conversation practice, learning, and everyday workday resets—with local Ollama support or your own Google Gemini key.

### How Hush Companion supports people

Hush Companion supports people with small, practical moments of help—not medical treatment. It gives users a calm place to begin when they need to think out loud, organize a situation, or take a pause.

It can help by:

- Making it easier to speak freely when typing feels difficult
- Reflecting what a person says so they can understand their thoughts more clearly
- Breaking a complicated situation into smaller, manageable parts
- Providing conversation practice for presentations, disagreements, and difficult discussions
- Explaining topics aloud through the Listen mode
- Offering short, non-clinical grounding, breathing, journaling, and workday reset prompts
- Encouraging one practical next step instead of giving an overwhelming list of advice
- Letting users choose local Ollama or bring their own Google Gemini key

Hush Companion should be presented as a tool for reflection, practice, learning, and everyday wellbeing. It is not a replacement for trusted relationships, qualified professionals, therapy, or emergency services.

### Who Hush Companion is for

- People who prefer speaking over typing
- Developers exploring local and bring-your-own-key AI
- Students practicing presentations or difficult conversations
- People who want a private tool for reflection and journaling prompts
- Teams evaluating voice interfaces and non-clinical workplace wellness ideas

### Differentiators

- Open-source MIT license
- No login or account required in the self-hosted version
- Bring-your-own Gemini key or local Ollama provider
- Local-first conversation and transcript handling
- Optional local Kokoro voice generation
- Simple, calm interface with Vent, Debate, Listen, and Wellness modes
- Transparent limits instead of medical or enterprise claims

### Example launch copy

> Meet Hush Companion—a voice-first AI companion for the moments when you need to get your thoughts out of your head. Vent, debate, listen, or take a wellness check-in in a calm interface with your own Gemini key or a fully local Ollama model. No account required. Open source and privacy-conscious by design.

Marketing must remain accurate. When Gemini is selected, conversation text leaves the browser and is sent to Google. The user owns the Gemini key and is responsible for its quotas, charges, restrictions, and rotation.

For setup services, private self-hosted deployments, custom development, and validation guidance, read the [monetization roadmap](monetization.md).

## Corporate direction

A future hosted or private corporate edition could offer private workspaces, hosted AI and voice, privacy-preserving aggregate reports, data retention controls, custom branding, and priority support. Employers should not be able to read individual employee conversations.

The current repository is not enterprise-ready: it has no accounts, tenant separation, corporate admin controls, server-side retention policies, or enterprise security certification. Read the [corporate wellness direction](corporate-wellness.md) before making workplace or compliance claims.

## Development

```bash
npm run typecheck
npm test
npm run build
```

Please add or update tests for behavior changes and never commit API keys, `.env` files, dependency folders, virtual environments, or generated artifacts.

## Contact and support

For questions, feedback, deployment requests, or partnership ideas, email [hello.hushcompanion@gmail.com](mailto:hello.hushcompanion@gmail.com) or contact [devkdas on GitHub](https://github.com/devkdas).

Hush Companion is maintained by **devkdas**. Support ongoing maintenance, accessibility work, documentation, security improvements, and new voice features through [GitHub Sponsors](https://github.com/sponsors/devkdas).

## External project references

- [React documentation](https://react.dev/)
- [Vite guide](https://vite.dev/guide/)
- [Expo documentation](https://docs.expo.dev/)
- [Cloudflare Tunnel documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Project README](../README.md)
- [MIT License](../LICENSE)
