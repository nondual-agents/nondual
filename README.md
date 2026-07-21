# nondual

Your agents' system of record for every contact, conversation and next step.

[![npm](https://img.shields.io/npm/v/nondual)](https://www.npmjs.com/package/nondual)
[![GitHub stars](https://img.shields.io/github/stars/nondual-agents/nondual)](https://github.com/nondual-agents/nondual/stargazers)

Give any agent a memory for the people it works with. One install. No forms. No data entry.

---

## Quick start

```bash
npx nondual init
npx nondual get-contact-info dario@anthropic.com
npx nondual record-contact-interaction dario@anthropic.com \
  --summary "agent looked up Dario to explore the possibilities of nondual"
```

Get a key:

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
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
npx nondual get-contact-info dario@anthropic.com --json     # raw JSON
npx nondual get-contact-info dario@anthropic.com --enrich false  # workspace-only, no enrichment
```

### `nondual record <email>`

Record an interaction. Optionally create a followup or complete existing ones in the same call.

```bash
npx nondual record dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities"

# With full body inline:
npx nondual record dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities" \
  --details "Hi Dario, I wanted to reach out about..."

# Load body from a file:
npx nondual record dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities" \
  --details-file ./email-body.txt

# Create a followup in the same call:
npx nondual record dario@anthropic.com \
  --channel call \
  --summary "Discussed partnership" \
  --followup "Send proposal deck" \
  --due 2026-08-01

# Complete all open followups at the same time:
npx nondual record dario@anthropic.com \
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

### `nondual followups`

List open followups with contact snippets. Filter by due date, owner, or company.

```bash
npx nondual followups
npx nondual followups --due-before 2026-08-01
npx nondual followups --company anthropic.com
npx nondual followups --json
```

### `nondual company-activity <domain>`

All contacts and recent interactions for a company domain.

```bash
npx nondual company-activity anthropic.com
npx nondual company-activity anthropic.com --json
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

---

## REST API

Base URL: `https://api.nondual.cloud/v1`

Auth: `Authorization: Bearer YOUR_KEY`

### `POST /get-contact-info`

```bash
curl -s -X POST https://api.nondual.cloud/v1/get-contact-info \
  -H "Authorization: Bearer YOUR_KEY" \
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
    "do_not_disturb_set_at": null,
    "identifiers": {
      "emails": ["dario@anthropic.com"],
      "linkedin_url": "https://linkedin.com/in/darioamodei",
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

### `POST /record-contact-interaction`

```bash
curl -s -X POST https://api.nondual.cloud/v1/record-contact-interaction \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "X-Nondual-Agent: my-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "dario@anthropic.com",
    "channel": "email",
    "direction": "outbound",
    "summary": "Sent intro about partnership opportunities",
    "followup_action": "Send proposal deck",
    "followup_due": "2026-08-01"
  }'
```

### `GET /list-open-followups`

```bash
curl -s "https://api.nondual.cloud/v1/list-open-followups?due_before=2026-08-01" \
  -H "Authorization: Bearer YOUR_KEY"
```

### `GET /get-company-activity?domain=`

```bash
curl -s "https://api.nondual.cloud/v1/get-company-activity?domain=anthropic.com" \
  -H "Authorization: Bearer YOUR_KEY"
```

---

## MCP tools

| Tool | Input | What it does |
|---|---|---|
| `get_contact_info` | `contact`, `enrich?` | Full profile + relationship context |
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

## Or paste this to your agent

If your workflow is a chat with an AI agent (Cursor, Claude Code, Hermes, Codex), paste this prompt directly:

```
Set up nondual in this project. Nondual is my agents' system of record for
every contact, conversation and next step.

1. Read https://nondual.cloud/agents.md?src=prompt and follow the setup for
   your platform, MCP or CLI. If you cannot browse the web, run:
   npx nondual init
2. The API key needs one email address. Ask me which one to use.
3. Verify the setup: call get-contact-info on dario@anthropic.com, then
   record-contact-interaction on the same contact with the summary
   "agent looked up Dario to explore the possibilities of nondual".
4. Show me the profile you received and confirm the write landed.
```

The agent reads the onboarding docs, sets up MCP or CLI, obtains a key, and reports the resolved profile back in chat.


## Docs

Full reference: [nondual.cloud/docs](https://nondual.cloud/docs)

## License

MIT

