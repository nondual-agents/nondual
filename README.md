# nondual

The address book for AI agents.

[![npm](https://img.shields.io/npm/v/nondual)](https://www.npmjs.com/package/nondual)
[![GitHub stars](https://img.shields.io/github/stars/nondual-agents/nondual)](https://github.com/nondual-agents/nondual/stargazers)

Give any agent a memory for the people it works with. One install. No forms. No data entry.

If this is useful, [star it](https://github.com/nondual-agents/nondual) — it helps other developers find it.

---

## Quick start

```bash
npx nondual init                                    # store your API key
npx nondual get-contact-info dario@anthropic.com   # get contact information
```

Get a key:

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

Or call `get-contact-info` without a key — 3 free lookups per day, no signup.

---

## MCP (Cursor, Claude, Hermes, any MCP client)

Add to your MCP config:

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

Both `https://mcp.nondual.cloud/mcp` and `https://mcp.nondual.cloud` are accepted.

---

## CLI

Install once or use via `npx`:

```bash
npm install -g nondual
# or: npx nondual <command>
```

### `nondual init`

Store your API key locally (`~/.nondual`).

```bash
npx nondual init
```

### `nondual get-contact-info <email|linkedin_url|phone|@handle>`

Get the full contact profile: name, role, company, relationship summary, recent interactions, open followups, and recommended next action.

```bash
npx nondual get-contact-info dario@anthropic.com

# Name:     Dario Amodei
# Role:     Co-Founder & CEO
# Company:  Anthropic
# LinkedIn: https://linkedin.com/in/darioamodei
# GitHub:   darioamodei
#
# Co-founder and CEO of Anthropic...
#
# Relationship: Sent intro 6 days ago. Follow-up proposal is due.
# Recommended: Follow up with a concrete proposal.
```

Options:

```bash
npx nondual get-contact-info dario@anthropic.com --json            # raw JSON
npx nondual get-contact-info dario@anthropic.com --enrich false    # workspace-only, no enrichment
```

### `nondual record-contact-interaction <email>`

Record an interaction. Optionally create a followup or complete existing ones in the same call.

```bash
npx nondual record-contact-interaction dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities"

# With full body inline:
npx nondual record-contact-interaction dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities" \
  --details "Hi Dario, I wanted to reach out about..."

# Load body from a file:
npx nondual record-contact-interaction dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities" \
  --details-file ./email-body.txt

# Create a followup in the same call:
npx nondual record-contact-interaction dario@anthropic.com \
  --channel call \
  --summary "Discussed partnership" \
  --followup "Send proposal deck" \
  --due 2026-08-01

# Complete all open followups at the same time:
npx nondual record-contact-interaction dario@anthropic.com \
  --channel email \
  --summary "Sent the proposal" \
  --complete all
```

| Flag | Required | Values | Description |
|---|---|---|---|
| `--channel` | yes | `email` `call` `linkedin` `slack` `meeting` `sms` `other` | Communication channel |
| `--direction` | no | `inbound` `outbound` `unknown` | Who initiated (default: `outbound`) |
| `--summary` | yes | string | One-sentence description |
| `--details` | no | string | Full content — email body, transcript, notes. No length limit. |
| `--details-file` | no | path | File whose contents become `details` |
| `--followup` | no | string | Create a followup with this action text |
| `--due` | no | ISO date | Due date for the followup |
| `--complete` | no | `all` or comma-separated IDs | Complete followups in the same call |

### `nondual list-open-followups`

List open followups with contact snippets. Filter by due date, owner, or company.

```bash
npx nondual list-open-followups
npx nondual list-open-followups --due-before 2026-08-01
npx nondual list-open-followups --company anthropic.com
npx nondual list-open-followups --json
```

### `nondual get-company-activity <domain>`

All contacts and recent interactions for a company domain.

```bash
npx nondual get-company-activity anthropic.com
npx nondual get-company-activity anthropic.com --json
```

### `nondual search <query>`

Search contacts by name, company, or email.

```bash
npx nondual search "anthropic"
```

### `nondual whoami`

Show your current API key and the source it came from.

```bash
npx nondual whoami

# Email:  you@example.com
# Key:    nd_12cb94...
# Source: ~/.nondual/config.json
```

---

## TypeScript SDK

```bash
npm install nondual
```

```typescript
import { Nondual } from 'nondual';

const nd = new Nondual({ apiKey: process.env.NONDUAL_API_KEY });
```

### `nd.getContactInfo(input)`

```typescript
const res = await nd.getContactInfo({ contact: 'dario@anthropic.com' });

console.log(res.contact.name);                 // "Dario Amodei"
console.log(res.contact.profile.role);         // "Co-Founder & CEO"
console.log(res.contact.company.name);         // "Anthropic"
console.log(res.contact.do_not_disturb);       // false
console.log(res.relationship_summary);         // "2 interactions from your agents"
console.log(res.recent_interactions);          // [{ channel, occurred_at, summary }, ...]
console.log(res.open_followups);               // [{ id, action, due }, ...]
console.log(res.recommended_next_action);      // "Follow up with a concrete proposal."
```

Pass `also` when you have both an email and LinkedIn URL for the same person — guarantees a single merged contact regardless of enrichment data:

```typescript
const res = await nd.getContactInfo({
  contact: 'kai@company.com',
  also: ['https://linkedin.com/in/kuhlig'],
});
```

Set `enrich: false` for a fast workspace-only lookup (no external enrichment):

```typescript
const res = await nd.getContactInfo({ contact: 'dario@anthropic.com', enrich: false });
```

### `nd.recordContactInteraction(input)`

```typescript
const res = await nd.recordContactInteraction({
  contact: 'dario@anthropic.com',
  channel: 'email',
  direction: 'outbound',
  summary: 'Sent intro about partnership opportunities',
  details: 'Hi Dario, I wanted to reach out...',   // optional
  followup_action: 'Send proposal deck',            // optional: create followup in same call
  followup_due: '2026-08-01',
  complete_followups: 'all',                        // optional: close open followups
}, { agent: 'sales-bot' });

console.log(res.interaction.id);        // "interaction_..."
console.log(res.followup_created);      // { id, action, due } or null
console.log(res.followups_completed);   // ["followup_..."]
console.log(res.contact_created);       // true if this was a new contact
```

### `nd.listOpenFollowups(params?)`

```typescript
const res = await nd.listOpenFollowups({
  due_before: '2026-08-01',   // optional
  owner: 'sales-bot',          // optional
  company: 'anthropic.com',    // optional — exact domain match
});

for (const f of res.followups) {
  console.log(f.action, f.due, f.contact.name, f.contact.do_not_disturb);
}
```

### `nd.getCompanyActivity(input)`

```typescript
const res = await nd.getCompanyActivity({ domain: 'anthropic.com' });

console.log(res.domain);          // "anthropic.com"
console.log(res.total_contacts);  // 3
for (const c of res.contacts) {
  console.log(c.name, c.interactions.length);
}
```

### `nd.imports(input)`

Bulk-upsert contacts, interactions, and follow-ups in one call. Up to 5000 rows.

```typescript
const res = await nd.imports({ rows: [
  {
    email: 'dario@anthropic.com',
    linkedin_url: 'https://linkedin.com/in/darioamodei',
    name: 'Dario Amodei',
    company: 'Anthropic',
    company_domain: 'anthropic.com',
    summary: 'Met at AI Summit 2026',
    channel: 'meeting',
    occurred_at: '2026-06-15T09:00:00Z',
    action: 'Send follow-up email',
    due: '2026-08-01',
  }
]});

console.log(res.imported.contacts_created);     // 1
console.log(res.imported.interactions_created); // 1
console.log(res.imported.followups_created);    // 1
```

---

## REST API

Base URL: `https://api.nondual.cloud/v1`

Auth: `Authorization: Bearer YOUR_API_KEY`

### `POST /v1/keys` — get a key

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com", "requested_by":"agent"}'
```

```json
{
  "api_key": "nd_xxxxxxxxxxxxxxxxxxxx",
  "status": "unclaimed",
  "message": "Key issued. A claim code was sent to you@example.com."
}
```

Claim the key (removes workspace restrictions):

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys/claim \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com", "otp":"123456"}'
```

### `POST /v1/get-contact-info`

```bash
curl -s -X POST https://api.nondual.cloud/v1/get-contact-info \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact": "dario@anthropic.com"}'
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

Pass `also` to merge an email and LinkedIn URL into one contact:

```bash
curl -s -X POST https://api.nondual.cloud/v1/get-contact-info \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contact": "kai@company.com", "also": ["https://linkedin.com/in/kuhlig"]}'
```

### `POST /v1/record-contact-interaction`

```bash
curl -s -X POST https://api.nondual.cloud/v1/record-contact-interaction \
  -H "Authorization: Bearer ***" \
  -H "X-Nondual-Agent: my-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "dario@anthropic.com",
    "channel": "email",
    "direction": "outbound",
    "summary": "Sent intro about partnership opportunities",
    "details": "Hi Dario, I wanted to reach out about a potential partnership. Happy to share more about what we are building.",
    "followup_action": "Send proposal deck",
    "followup_due": "2026-08-01"
  }'
```

### `GET /v1/list-open-followups`

```bash
curl -s "https://api.nondual.cloud/v1/list-open-followups?due_before=2026-08-01" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### `GET /v1/get-company-activity?domain=`

```bash
curl -s "https://api.nondual.cloud/v1/get-company-activity?domain=anthropic.com" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### `POST /v1/imports`

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
        "summary": "Met at AI Summit 2026",
        "channel": "meeting",
        "action": "Send follow-up email",
        "due": "2026-08-01"
      }
    ]
  }'
```

---

## MCP tools

| Tool | Input | What it does |
|---|---|---|
| `get_contact_info` | `contact`, `enrich?`, `also?` | Full profile + relationship context |
| `record_contact_interaction` | `contact`, `channel`, `summary`, `followup_action?`, `complete_followups?` | Log interaction, create/close followups |
| `list_open_followups` | `due_before?`, `owner?`, `company?` | All open followups with contact snippets |
| `get_company_activity` | `domain` | All contacts + interactions for a company |

---

## The memory loop

The value of Nondual is the **memory loop**, not just enrichment:

```
agent_sales  →  get_contact_info("dario@anthropic.com")      # who is this? any history?
agent_sales  →  record_contact_interaction(channel=email, …)  # log the outreach + create followup
agent_exec   →  get_contact_info("dario@anthropic.com")      # weeks later, different agent
               ← sees: who reached out, when, what was said, open followup, recommended next step
```

Every agent on your key reads and writes the same relationship.

---

## Examples

Runnable examples live in [`examples/`](./examples/):

- [`examples/typescript/full-loop.ts`](./examples/typescript/full-loop.ts) — the four-call memory loop
- [`examples/typescript/csv-import.ts`](./examples/typescript/csv-import.ts) — import a LinkedIn connections export
- [`examples/python/rest-loop.py`](./examples/python/rest-loop.py) — the same loop in Python via REST
- [`examples/cursor-rules/`](./examples/cursor-rules/) — drop-in rules for Cursor agents

---

## Docs

- [`docs/api.md`](./docs/api.md) — REST API reference
- [`docs/mcp.md`](./docs/mcp.md) — MCP setup (Cursor, Claude, Hermes)
- [`docs/cli.md`](./docs/cli.md) — CLI commands and flags
- [`docs/sdk.md`](./docs/sdk.md) — TypeScript SDK
- [`docs/agents.md`](./docs/agents.md) — Agent onboarding and prompt templates
- Live: [nondual.cloud/docs](https://nondual.cloud/docs)

## License

MIT
