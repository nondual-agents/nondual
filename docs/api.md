# Nondual REST API

The address book for AI agents.

Direct HTTP access. All endpoints accept and return JSON.

---

## Base URL

```
https://api.nondual.cloud/v1
```

## Authentication

Pass your key in the Authorization header on every authenticated request.

```
Authorization: Bearer YOUR_API_KEY
```

Get a key:

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

## Agent attribution

Pass the calling agent name in `X-Nondual-Agent` on write calls. Stored with every interaction.

```
X-Nondual-Agent: my-sales-agent
```

---

## POST /v1/keys — get a key

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com", "requested_by":"agent"}'
```

Response:

```json
{
  "api_key": "nd_xxxxxxxxxxxxxxxxxxxx",
  "status": "unclaimed",
  "message": "Key issued. A claim code was sent to you@example.com."
}
```

Claim the key:

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys/claim \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com", "otp":"123456"}'
```

---

## POST /v1/get-contact-info

Get the full contact profile: name, role, company, do_not_disturb flag, relationship summary, recent interactions, open followups, and recommended next action. Works without a key (3 free per day per IP).

```bash
curl -s -X POST https://api.nondual.cloud/v1/get-contact-info \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact":"dario@anthropic.com"}'
```

Request body:
- `contact` (required) — email, LinkedIn URL (`linkedin.com/in/slug`), phone (E.164), or @handle
- `enrich` (optional, default true) — set false for workspace-only lookup, no vendor calls
- `also` (optional) — array of additional identifiers that belong to the same person.
  When provided, the system merges all matching contacts into one and runs enrichment on
  every identifier. Use this when you have both an email and a LinkedIn URL for the same
  contact and want a guaranteed single record regardless of enrichment data coverage.

```json
{
  "contact": "kai@company.com",
  "also": ["https://linkedin.com/in/kuhlig"],
  "enrich": true
}
```

Response:

```json
{
  "contact": {
    "id": "contact_...",
    "name": "Dario Amodei",
    "do_not_disturb": false,
    "identifiers": {
      "emails": ["dario@anthropic.com"],
      "linkedin_url": "linkedin.com/in/darioamodei",
      "phones": [],
      "handles": []
    },
    "profile": { "role": "Co-Founder & CEO", "about": "...", "location": "..." },
    "company": { "name": "Anthropic", "domain": "anthropic.com" },
    "next": { "action": "Follow up with a concrete proposal." }
  },
  "enriched": true,
  "relationship_summary": "2 interactions. Follow-up proposal is due.",
  "recommended_next_action": "Follow up with a concrete proposal.",
  "recent_interactions": [],
  "open_followups": []
}
```

---

## POST /v1/record-contact-interaction

Record an outreach. Unknown contacts are created on the spot — no prior lookup required.

```bash
curl -s -X POST https://api.nondual.cloud/v1/record-contact-interaction \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "X-Nondual-Agent: my-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "dario@anthropic.com",
    "summary": "Sent intro about partnership",
    "channel": "email",
    "direction": "outbound",
    "followup_action": "Send proposal deck",
    "followup_due": "2026-08-01"
  }'
```

Request body:
- `contact` (required) — email, LinkedIn URL, phone, or @handle
- `summary` (required) — what happened, in plain language
- `channel` — `email` | `call` | `meeting` | `message` | `linkedin` | `twitter` | `other`
- `direction` — `inbound` | `outbound` | `unknown`
- `agent` — agent name (also accepted via `X-Nondual-Agent` header)
- `details` — full content of the communication (email body, transcript, notes)
- `occurred_at` — ISO 8601 timestamp, defaults to now. Use for historical backfill.
- `followup_action`, `followup_due`, `followup_agent` — creates a followup in the same call
- `complete_followups` — array of followup IDs, or the string `"all"`
- `do_not_disturb` — `true` sets flag; `false` clears it

Response: `{ interaction, followup_created, followups_completed, contact_created }`

---

## GET /v1/list-open-followups

All open followups. Each row includes a contact snippet so no extra lookup is needed.

```bash
curl -s https://api.nondual.cloud/v1/list-open-followups \
  -H "Authorization: Bearer YOUR_API_KEY"

# With filters:
curl -s "https://api.nondual.cloud/v1/list-open-followups?due_before=2026-08-01&company=acme.com" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Query params (all optional):
- `due_before` — ISO date, defaults to end of today
- `owner` — agent name
- `company` — domain name

Response: `{ followups: Followup[] }` where each followup includes a `contact` snippet.

---

## GET /v1/get-company-activity?domain=\<domain\>

All contacts and interactions at a company. Strict domain match.

```bash
curl -s "https://api.nondual.cloud/v1/get-company-activity?domain=anthropic.com" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Query params:
- `domain` (required) — company domain name

Response: `{ domain: string, contacts: Contact[] }` where each contact includes its interactions.

---

## POST /v1/imports

Bulk-upsert contacts, interactions, and follow-ups in one call. Up to 5000 rows per request.
Use this to seed a workspace from a CSV export, sync a CRM, or backfill historical outreach.

```bash
curl -s -X POST https://api.nondual.cloud/v1/imports \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rows": [
      {
        "email": "dario@anthropic.com",
        "linkedin_url": "https://linkedin.com/in/darioamodei",
        "name": "Dario Amodei",
        "company": "Anthropic",
        "company_domain": "anthropic.com",
        "role": "CEO",
        "summary": "Met at AI Summit 2026",
        "channel": "meeting",
        "direction": "outbound",
        "occurred_at": "2026-06-15T09:00:00Z",
        "action": "Send follow-up email",
        "due": "2026-08-01"
      }
    ]
  }'
```

**Row fields:**

Contact identity (at least one required):
- `email` — normalized email address
- `linkedin_url` — LinkedIn profile URL

Contact fields (all optional):
- `name` — full name (or use `first_name` + `last_name`)
- `role` — job title
- `company`, `company_domain` — company name and domain
- `location` — city, region, country string

Interaction fields (written only if both `summary` and `channel` are present):
- `summary` — what happened, plain language
- `channel` — `email` | `call` | `linkedin` | `slack` | `meeting` | `sms` | `other`
- `direction` — `inbound` | `outbound` | `unknown`. Defaults to `outbound`.
- `occurred_at` — ISO 8601 timestamp. Defaults to now.
- `agent` — agent name for attribution

Follow-up fields (written only if `action` is present):
- `action` — what to do next, plain language
- `due` — ISO date (e.g. `"2026-08-01"`)
- `agent` — agent to assign it to

**Response:**

```json
{
  "imported": {
    "contacts_created": 3,
    "contacts_updated": 1,
    "interactions_created": 4,
    "followups_created": 2
  },
  "errors": [],
  "total_rows": 4
}
```

Per-row errors (up to 50 shown) — other rows still process.

---

## GET /health

```bash
curl https://api.nondual.cloud/health
# {"status":"ok"}
```

---

## Contact shape

```json
{
  "id": "contact_...",
  "name": "Dario Amodei",
  "do_not_disturb": false,
  "do_not_disturb_set_at": null,
  "identifiers": {
    "emails": ["dario@anthropic.com"],
    "linkedin_url": "linkedin.com/in/darioamodei",
    "phones": [],
    "handles": []
  },
  "profile": {
    "role": "Co-Founder & CEO",
    "headline": "...",
    "about": "...",
    "location": "San Francisco, CA",
    "skills": [],
    "profiles": { "github": null, "twitter": "darioamodei", "website": null }
  },
  "company": { "name": "Anthropic", "domain": "anthropic.com" },
  "relationship": {
    "summary": "2 interactions. Follow-up is due.",
    "stage": null,
    "last_interaction_at": "2026-07-21T..."
  },
  "next": { "action": "Follow up with a proposal.", "due": null, "owner": null },
  "created_at": "2026-07-01T...",
  "updated_at": "2026-07-21T..."
}
```

---

## Links

- Live playground: https://nondual.cloud
- MCP setup: [mcp.md](./mcp.md)
- CLI: [cli.md](./cli.md)
- TypeScript SDK: [sdk.md](./sdk.md)
- Agent onboarding: [agents.md](./agents.md)
- GitHub: https://github.com/nondual-agents/nondual
