# Nondual — Agent Onboarding

The address book for AI agents.

This document covers setup and the four tools. For the full REST reference see [api.md](./api.md).

Read top to bottom. Follow the setup for your platform. Verify your work at Step 3.

---

## What Nondual does

One API key gives every agent you run access to a shared workspace. Any agent can:

- Look up a person by email, LinkedIn URL, phone, or social handle and get their full profile,
  interaction history, open follow-ups, and a recommended next step.
- Record an outreach — email, call, meeting, message — and attach a follow-up in one call.
- List all open follow-ups due today, by owner, or by company domain.
- Pull every contact and interaction at a company by domain.
- Bulk-import contacts, interactions, and follow-ups from a CSV or CRM export (up to 5000 rows).

All agents on the same key share the same memory. Ten agents work like one team.

---

## Step 1 — Get a key

### Agent path (recommended)

You are an agent. Use this path — you receive the key in the API response, no inbox visit.

**CLI:**

```bash
npx nondual init --agent --email HUMAN_EMAIL
```

Output is JSON. The key is in `api_key`. Store it in your project secrets as `NONDUAL_API_KEY`.

**API directly:**

```bash
curl -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email": "HUMAN_EMAIL", "requested_by": "agent"}'
```

Response:

```json
{
  "api_key": "nd_xxxxxxxxxxxxxxxxxxxx",
  "status": "unclaimed",
  "restrictions": "own contacts only; one permitted human contact (signup email)",
  "expires_at": "2026-08-20T...",
  "message": "Key issued. A claim code was sent to HUMAN_EMAIL. Claiming lifts all restrictions."
}
```

Store `api_key`. Unclaimed keys work for own contacts and the signup email contact immediately.

### What "unclaimed" means

An unclaimed key has limited read access until the human verifies ownership:

- You can create contacts and look them up if you created them.
- You can look up the signup email contact.
- All other contact lookups return 403 with `"error": "key_unclaimed"`.

### Claim step (removes restrictions)

Nondual emails the human a 6-digit OTP when the key is issued. Once they have it:

```bash
curl -X POST https://api.nondual.cloud/v1/keys/claim \
  -H "Content-Type: application/json" \
  -d '{"email": "HUMAN_EMAIL", "otp": "123456"}'
```

Response: `{"claimed": true}`. Full access restored immediately.

The human can also claim at: https://nondual.cloud/claim

---

## Step 2 — Choose your interface

### MCP (Cursor, Claude Code, Windsurf, any MCP host)

Add to your MCP config:

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud",
      "headers": { "Authorization": "Bearer YOUR_KEY" }
    }
  }
}
```

Restart the MCP host. The four tools appear automatically.

### CLI

```bash
npx nondual init --agent --email EMAIL   # key returned in JSON
npx nondual get-contact-info EMAIL_OR_URL
npx nondual record-contact-interaction EMAIL --summary "what happened"
npx nondual list-open-followups
npx nondual get-company-activity DOMAIN
```

### TypeScript SDK

```typescript
import { Nondual } from 'nondual';
const nd = new Nondual(); // reads NONDUAL_API_KEY from env
const contact = await nd.getContactInfo({ contact: 'email@example.com' });
await nd.recordContactInteraction({ contact: 'email@example.com', summary: 'what happened' });
```

### REST

```bash
curl -X POST https://api.nondual.cloud/v1/get-contact-info \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact": "email@example.com"}'
```

---

## Step 3 — Verify

```bash
npx nondual get-contact-info dario@anthropic.com
npx nondual record-contact-interaction dario@anthropic.com \
  --summary "agent verified the nondual setup"
npx nondual get-contact-info dario@anthropic.com
# Interaction appears in the timeline — setup is complete
```

---

## The four tools

### get-contact-info

Look up a person. Returns full profile, relationship summary, recent interactions, open follow-ups, and recommended next action.

**Always call this before any outreach.** It tells you:
- Whether `do_not_disturb` is set — if true, do not reach out
- What your agents have already said to this person
- What the recommended next action is

```json
{ "contact": "dario@anthropic.com", "enrich": true }
```

**`also` — multi-identifier merge:**

When you have both an email and a LinkedIn URL for the same person, pass both:

```json
{
  "contact": "kai@company.com",
  "also": ["https://linkedin.com/in/kuhlig"],
  "enrich": true
}
```

The system treats this as ground truth. Both identifiers are merged into one contact,
enrichment runs on every identifier, and all alias keys are stored. This is the correct
pattern for LinkedIn connections exports where the CSV email may not match enrichment data.

Fields:
- `contact` (required) — email, LinkedIn URL, phone (E.164), or @handle
- `enrich` (optional, default `true`) — set `false` for workspace-only lookup
- `also` (optional) — array of additional identifiers for the same person

### record-contact-interaction

Record any outreach. Unknown contacts are created on the fly — no prior lookup required.

Required: `contact`, `summary`

Optional: `channel`, `direction`, `details`, `occurred_at`, `followup_action`, `followup_due`, `complete_followups`, `do_not_disturb`

### list-open-followups

What needs doing. Returns all open follow-ups with a contact snippet.

```
GET /v1/list-open-followups?due_before=2026-08-01&company=anthropic.com
```

### get-company-activity

Every contact and interaction at a company.

```
GET /v1/get-company-activity?domain=anthropic.com
```

### imports

Bulk-upsert contacts, interactions, and follow-ups. Up to 5000 rows per call.

```json
{
  "rows": [{
    "email": "dario@anthropic.com",
    "linkedin_url": "https://linkedin.com/in/darioamodei",
    "name": "Dario Amodei",
    "summary": "Met at AI Summit",
    "channel": "meeting",
    "action": "Send follow-up",
    "due": "2026-08-01"
  }]
}
```

---

## Identity — how contacts are matched

Nondual matches contacts across all known identifiers. A lookup by email will find a contact
that was created by LinkedIn URL, as long as enrichment returned that email for the profile.

**When enrichment can't bridge the gap** (e.g. a personal alias email not in vendor data),
use `also` to make an explicit assertion. The system merges immediately — no enrichment
agreement required.

---

## Prompt for your agent

Paste into your system prompt or `.cursorrules`:

```
You have access to Nondual — a shared memory for every person your agents talk to.

Before any outreach to a person, call get-contact-info with their email or LinkedIn URL.
Check do_not_disturb before sending anything. Read relationship_summary and open_followups.
After any outreach, call record-contact-interaction with channel, direction, and summary.
At the start of any sales or outreach workflow, call list-open-followups to see what's due.

MCP: https://mcp.nondual.cloud/mcp (Authorization: Bearer NONDUAL_API_KEY)
Docs: https://github.com/nondual-agents/nondual/blob/main/docs/agents.md
```

---

## Links

- Full docs: [docs/](.)
- REST API: [api.md](./api.md)
- MCP: [mcp.md](./mcp.md)
- CLI: [cli.md](./cli.md)
- SDK: [sdk.md](./sdk.md)
- Examples: [examples/](../examples/)
- GitHub: https://github.com/nondual-agents/nondual
- Website: https://nondual.cloud
