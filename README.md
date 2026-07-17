# nondual

Your agents' system of record for every contact, conversation and next step.

[![npm](https://img.shields.io/npm/v/nondual)](https://www.npmjs.com/package/nondual)
[![GitHub stars](https://img.shields.io/github/stars/nondual-agents/nondual)](https://github.com/nondual-agents/nondual/stargazers)

Give any agent a memory for the people it works with. One install. No forms. No data entry.

---

## Quick start

```bash
npx nondual init                          # store your API key
npx nondual resolve dario@anthropic.com  # resolve a contact
```

Get a key:

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

Or resolve without a key — 3 free resolves per day, no signup.

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
# Prompts: Enter your API key:
# Saved to ~/.nondual
```

### `nondual resolve <email>`

Resolve an email to a full contact profile. Returns name, role, company, verified profiles, a written summary, and a recommended next step.

```bash
npx nondual resolve dario@anthropic.com

# name       Dario Amodei
# role       Co-Founder & CEO
# company    Anthropic
# linkedin   https://linkedin.com/in/darioamodei
# github     darioamodei
# summary    Co-founder and CEO of Anthropic...
# next       Reach out via LinkedIn with a brief note about your shared interest in AI safety.
```

Options:

```bash
npx nondual resolve dario@anthropic.com --json   # raw JSON output
```

### `nondual context <email>`

Get relationship context for a contact before reaching out. Returns profile, full interaction history across all your agents, open follow-ups, and recommended next action.

```bash
npx nondual context dario@anthropic.com

# profile    Dario Amodei · Co-Founder & CEO · Anthropic
# history    2 interactions from your agents
#   agent_sales  email · 6 days ago  Sent intro re: partnership
#   agent_exec   call  · 3 days ago  15-min call, discussed use case
# followups  1 open
#   Follow up with a concrete proposal (due 2026-07-25)
# next       Follow up with a concrete proposal.
```

Options:

```bash
npx nondual context dario@anthropic.com --purpose "partnership call"
npx nondual context dario@anthropic.com --json
```

### `nondual record <email>`

Record an interaction after any outreach. Your agent name is stored with the interaction so history is attributed.

```bash
npx nondual record dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities" \
  --agent my-sales-agent

# With full email body inline
npx nondual record dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities" \
  --details "Hi Dario, I wanted to reach out about..." \
  --agent my-sales-agent

# Load body from a file (email export, transcript, meeting notes)
npx nondual record dario@anthropic.com \
  --channel email \
  --direction outbound \
  --summary "Sent intro about partnership opportunities" \
  --details-file ./email-body.txt \
  --agent my-sales-agent
```

Options:

| Flag | Required | Values | Description |
|---|---|---|---|
| `--channel` | yes | `email` `call` `linkedin` `slack` `meeting` `sms` `other` | Communication channel |
| `--direction` | yes | `inbound` `outbound` | Who initiated |
| `--summary` | yes | string | One-sentence description of what happened |
| `--details` | no | string | Full content — email body, transcript, notes. No length limit. |
| `--details-file` | no | path | File whose contents become `details` (email export, transcript, etc.) |
| `--agent` | no | string | Agent name (defaults to `cli`) |

### `nondual followup <email>`

Create a follow-up task for a contact.

```bash
npx nondual followup dario@anthropic.com \
  --action "Follow up with proposal" \
  --due 2026-07-25

# Follow-up created for dario@anthropic.com
# action: Follow up with proposal
# due:    2026-07-25
```

Options:

| Flag | Required | Description |
|---|---|---|
| `--action` | yes | What to do |
| `--due` | no | ISO date (YYYY-MM-DD) |
| `--agent` | no | Agent name |

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

### `nd.resolve(input, options?)`

```typescript
const { contact } = await nd.resolve({ email: 'dario@anthropic.com' });

console.log(contact.name);               // "Dario Amodei"
console.log(contact.profile.role);       // "Co-Founder & CEO"
console.log(contact.company.name);       // "Anthropic"
console.log(contact.identifiers.linkedin_url);
console.log(contact.profile.about);      // written summary
console.log(contact.next.action);        // recommended next step
```

### `nd.context(input, options?)`

```typescript
const { context } = await nd.context(
  { contact: 'dario@anthropic.com' },
  { agent: 'research-bot' },
);

console.log(context.relationship_summary);   // "2 interactions from your agents"
console.log(context.recent_interactions);
// [{ channel, occurred_at, summary, details }, ...]
console.log(context.open_followups);
// [{ id, action, due }, ...]
console.log(context.recommended_next_action);
```

### `nd.record(input, options?)`

```typescript
await nd.record({
  contact: 'dario@anthropic.com',
  channel: 'email',
  direction: 'outbound',
  summary: 'Sent intro about partnership opportunities',
  details: 'Hi Dario, I wanted to reach out...',  // optional — full body
}, { agent: 'sales-bot' });
```

### `nd.followup(input, options?)`

```typescript
await nd.followup({
  contact: 'dario@anthropic.com',
  action: 'Follow up in 3 days',
  due: '2026-07-25',
}, { agent: 'sales-bot' });
```

---

## REST API

Base URL: `https://api.nondual.cloud/v1`

Auth: `Authorization: Bearer YOUR_API_KEY`

### `POST /resolve`

```bash
curl -s -X POST https://api.nondual.cloud/v1/resolve \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"contact": "dario@anthropic.com"}'
```

Response:

```json
{
  "contact": {
    "id": "contact_...",
    "name": "Dario Amodei",
    "identifiers": {
      "emails": ["dario@anthropic.com"],
      "linkedin_url": "https://linkedin.com/in/darioamodei",
      "phones": [],
      "handles": []
    },
    "profile": { "role": "Co-Founder & CEO", "about": "...", "location": "..." },
    "company": { "name": "Anthropic", "domain": "anthropic.com" },
    "next": { "action": "Reach out via LinkedIn..." }
  }
}
```

### `POST /context`

```bash
curl -s -X POST https://api.nondual.cloud/v1/context \
  -H "Authorization: Bearer $NONDUAL_API_KEY" \
  -H "X-Nondual-Agent: my-agent" \
  -H "Content-Type: application/json" \
  -d '{"contact": "dario@anthropic.com"}'
```

### `POST /interactions`

```bash
curl -s -X POST https://api.nondual.cloud/v1/interactions \
  -H "Authorization: Bearer $NONDUAL_API_KEY" \
  -H "X-Nondual-Agent: my-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "dario@anthropic.com",
    "channel": "email",
    "direction": "outbound",
    "summary": "Sent intro about partnership opportunities"
  }'
```

### `POST /followups`

```bash
curl -s -X POST https://api.nondual.cloud/v1/followups \
  -H "Authorization: Bearer $NONDUAL_API_KEY" \
  -H "X-Nondual-Agent: my-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "dario@anthropic.com",
    "action": "Follow up with proposal",
    "due": "2026-07-25"
  }'
```

---

## MCP tools

| Tool | Input | What it does |
|---|---|---|
| `contacts_resolve` | `email` | Resolve to full profile |
| `contacts_context` | `contact`, `purpose?` | Get relationship history + next step |
| `contacts_record` | `contact`, `channel`, `direction`, `summary` | Log an interaction |
| `contacts_followup` | `contact`, `action`, `due?` | Create a follow-up task |

---

## The memory loop

The value of Nondual is the **memory loop**, not just enrichment:

```
agent_sales  →  contacts_resolve("dario@anthropic.com")   # who is this person?
agent_sales  →  contacts_record(channel=email, ...)        # log the outreach
agent_exec   →  contacts_context("dario@anthropic.com")    # weeks later, different agent
               ← sees: who reached out, when, what was said, what to do next
```

Every agent on your key reads and writes the same relationship.

---

## Docs

Full reference: [nondual.cloud/docs](https://nondual.cloud/docs)

## License

MIT
