# Corporate wellness direction

Hush Companion now includes a **Wellness check-in** mode for everyday, non-clinical wellbeing support.

## Wellness check-in

The mode can guide users through:

- Mood check-ins
- Guided breathing and grounding
- Stress reflection
- Short workday resets
- Journaling prompts
- Preparing for difficult conversations
- One healthy next-step suggestion

Use language such as **Wellness check-in**, **Workday reset**, **Reflect**, or **Mindful pause**. Avoid describing this mode as mental-health treatment.

Hush Companion must not claim to provide therapy, diagnosis, medical advice, crisis counseling, or emergency support. Keep the existing AI disclaimer visible and direct users to qualified professionals or emergency services when appropriate.

## Corporate product opportunity

A separate hosted or privately deployed corporate edition could offer:

- Private company workspaces
- Employee wellness check-ins
- Hosted AI and voice
- Anonymous aggregate reports
- No employer access to individual conversations
- SSO and team administration
- Data retention and deletion controls
- Custom branding
- Usage and wellbeing trends that exclude personal content
- Priority support and deployment assistance

### Privacy promise

Employers should not be able to read individual employee conversations. Any reporting should be aggregated, privacy-preserving, and designed to prevent re-identification. This promise requires a real tenant-aware backend, documented retention rules, access controls, audit logs, and independent security review before making it a corporate commitment.

## Current limitations

The open-source app is not enterprise-ready yet. It currently has:

- No accounts or tenant separation
- Browser-local settings and conversation state
- User-supplied Gemini keys
- No corporate admin controls
- No server-side audit or retention policies
- No enterprise security certification

Do not market the current repository as an enterprise compliance product.

## Product separation

```text
Open-source Hush Companion              Free self-hosted project
Personal wellness mode        Free / BYOK
Corporate Hush Companion                Separate hosted or private product
Custom deployment             Paid service
Enterprise support            Paid contract
```

A reasonable early pricing hypothesis is **$5–$15 per user/month**, plus private deployment and setup fees. Validate willingness to pay before building billing, employee analytics, or cloud conversation storage.

## Safe validation path

1. Test the Wellness check-in mode with individual users.
2. Interview wellness leads, people teams, and small businesses.
3. Validate whether private deployment or hosted convenience is the strongest need.
4. Define the privacy model before collecting any workplace data.
5. Build tenant isolation, access controls, retention controls, and aggregation safeguards before a corporate beta.
