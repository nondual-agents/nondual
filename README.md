# nondual

Your agents' system of record for every contact, conversation and next step.

[![npm](https://img.shields.io/npm/v/nondual)](https://www.npmjs.com/package/nondual)
[![GitHub stars](https://img.shields.io/github/stars/nondual-agents/nondual)](https://github.com/nondual-agents/nondual/stargazers)

Give any agent a memory for the people it works with. One install. No forms. No data entry.

**The wow in two beats:**
1. **Resolve.** Drop in one email. Get back a complete person: name, role, company, verified profiles, a written summary, and a recommended next step.
2. **Memory.** One agent records an outreach. A different agent asks for context. It sees who reached out, when, on what platform, what was said, and what happens next.

---

## Install

**MCP (Cursor, Claude, Hermes, any MCP client)**

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

**CLI**

```bash
npx nondual init
```

**TypeScript SDK**

```bash
npm install nondual
```

Get a key: `curl -s -X POST https://api.nondual.cloud/v1/keys -H "Content-Type: application/json" -d '{"email":"you@example.com"}'`

Or try without a key — 3 free resolves per day, no signup.

---

## The loop (two minutes)

### 1. Resolve a contact

```bash
curl -s -X POST https://api.nondual.cloud/v1/resolve \
  -H "Authorization: Bearer $NONDUAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "dario@anthropic.com"}'
```

### 2. Record an outreach (agent: sales-bot)

```bash
curl -s -X POST https://api.nondual.cloud/v1/interactions \
  -H "Authorization: Bearer $NONDUAL_API_KEY" \
  -H "X-Nondual-Agent: sales-bot" \
  -H "Content-Type: application/json" \
  -d '{"contact":"dario@anthropic.com","channel":"email","direction":"outbound","summary":"Sent intro about partnership opportunities"}'
```

### 3. Ask for context (agent: research-bot)

```bash
curl -s -X POST https://api.nondual.cloud/v1/context \
  -H "Authorization: Bearer $NONDUAL_API_KEY" \
  -H "X-Nondual-Agent: research-bot" \
  -H "Content-Type: application/json" \
  -d '{"contact":"dario@anthropic.com"}'
```

research-bot sees: who reached out, when, what was said, and the recommended next step — even though it's a different agent.

---

## MCP tools

Four tools. Locked names.

| Tool | What it does |
|---|---|
| `contacts_resolve` | Resolve any identifier to a full contact profile |
| `contacts_context` | Get relationship context before outreach |
| `contacts_record` | Record an interaction after outreach |
| `contacts_followup` | Create a followup task |

---

## TypeScript SDK

```typescript
import { Nondual } from 'nondual';

const nd = new Nondual({ apiKey: process.env.NONDUAL_API_KEY });

// Resolve
const { contact } = await nd.resolve({ email: 'dario@anthropic.com' });
console.log(contact.name, contact.profile.role);

// Record
await nd.record({
  contact: 'dario@anthropic.com',
  channel: 'email',
  direction: 'outbound',
  summary: 'Sent intro email about partnership',
}, { agent: 'sales-bot' });

// Context (as a different agent)
const { context } = await nd.context(
  { contact: 'dario@anthropic.com' },
  { agent: 'research-bot' },
);
console.log(context.recent_interactions);
```

---

## CLI

```bash
npx nondual init                              # store your key
npx nondual resolve dario@anthropic.com      # resolve a contact
npx nondual context dario@anthropic.com      # get context
npx nondual record dario@anthropic.com \
  --channel email --direction outbound \
  --summary "Sent intro email"
npx nondual followup dario@anthropic.com \
  --action "Follow up in 3 days"
```

---

## Docs

[nondual.cloud/docs](https://nondual.cloud/docs)

## License

MIT
