# Hush Companion monetization roadmap

Hush Companion is currently a **GitHub-only open-source project**. The MIT-licensed self-hosted version remains free, while optional developer services and community support can fund continued development.

## Current product model

The current repository does not include accounts, login, subscriptions, payments, hosted conversation storage, or a Hush Companion-owned Gemini key.

Users choose one of these free self-hosted options:

- **Bring-your-own Gemini key:** the user supplies their own Google AI Studio key in the browser and is responsible for Google's usage costs and quotas.
- **Local Ollama:** the user runs an Ollama server on their own machine and does not need an API key.
- **Offline fallback:** users can explore the interface without configuring a provider.

The repository should not advertise a hosted trial, sign-up flow, paid plan, or automatic billing until a separate hosted product is actually built and secured.

## Ways to support development

### GitHub Sponsors

Users who find Hush Companion useful can support maintenance through [GitHub Sponsors](https://github.com/sponsors/devkdas). Support can fund documentation, accessibility improvements, security work, testing, and new voice features.

### Setup and deployment help

Offer paid hands-on help while keeping the code free:

- Personal setup: **$49–$99**
- Small-business setup: **$199–$499**
- Custom deployment, branding, or integration: **$500+**

This can include installing Node.js, Ollama, Kokoro, or the optional API proxy; configuring a private network; setting up a domain; and explaining upgrades.

### Custom development

Offer custom work for teams that want changes to the open-source project, such as:

- Interface branding
- New conversation modes
- Private self-hosted deployment
- Accessibility improvements
- Internal integrations
- Mobile configuration
- Documentation and training

Discuss scope, privacy, maintenance, and pricing directly before starting work.

## Honest public pricing copy

The public app should describe the current state like this:

```text
GitHub open source                 Free · MIT licensed
Bring your own Gemini key         Free app; Google usage is the user's responsibility
Local Ollama                       Free app; runs on the user's machine
Setup and deployment help          Contact developer for an estimate
Custom development                 Discussed directly
Developer support                  GitHub Sponsors
```

The app does not collect payment details. Do not show a hosted plan as available, and do not promise a two-minute trial from the current browser-only build.

## Why not hardcode a shared Gemini key?

A Gemini key embedded in the frontend can be extracted by anyone who visits the site. Users could consume the quota, expose the key, or create unexpected charges. A real hosted product would require a server-side secret, authentication, rate limiting, usage tracking, budget controls, and a privacy policy.

For now, BYOK keeps the GitHub project simple and prevents the maintainer from paying for every user's model usage.

## Future hosted product

A hosted edition may be considered later if enough people request it. It should be developed separately from this GitHub-only build and should not be announced as live until it has:

- Server-side provider secrets
- Authentication and account recovery
- Per-user usage limits
- Abuse prevention and rate limiting
- Secure data-retention controls
- Monitoring and budget alerts
- Clear terms, privacy policy, and AI safety boundaries
- A tested upgrade and support process

Validate demand first through GitHub issues, conversations, a waitlist, or direct email. Do not add login or payment infrastructure merely to test whether people are interested.

## Marketing guidance

Position Hush Companion as:

> **A private voice companion for thinking out loud.**

Emphasize the free MIT license, self-hosting, local Ollama option, BYOK Gemini option, voice-first interface, and transparent limitations. Be clear that Gemini conversation text is sent to Google when the user selects Gemini, and that browser-supplied keys are not true secrets.

Do not describe Hush Companion as therapy, diagnosis, medical care, crisis support, emergency assistance, or a human relationship. The Wellness check-in is for non-clinical reflection, grounding, journaling, workday resets, and practical next steps.
