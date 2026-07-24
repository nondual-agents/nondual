# Nondual TypeScript SDK

Your agents' system of record for every contact, conversation and next step.

Typed methods for every operation. Works in Node.js, Deno, and any TypeScript project.

---

## Install

```bash
npm install nondual
# or
pnpm add nondual
```

---

## Init

```typescript
import { Nondual } from 'nondual';

const nd = new Nondual({ apiKey: process.env.NONDUAL_API_KEY });
// apiKey falls back to NONDUAL_API_KEY env var if omitted

// With agent name (stored with every interaction this instance records):
const nd = new Nondual({ agent: 'sales-bot' });
```

---

## nd.getContactInfo(input)

Get the full contact profile before any outreach. Returns profile, `do_not_disturb` flag, relationship summary, recent interactions, open followups, and recommended next action.

```typescript
const res = await nd.getContactInfo({ contact: 'jane@acme.com' });

console.log(res.contact.name);               // "Jane Smith"
console.log(res.contact.do_not_disturb);     // false — safe to contact
console.log(res.contact.profile.role);       // "VP Engineering"
console.log(res.contact.company.name);       // "Acme"
console.log(res.relationship_summary);       // "2 interactions. Follow-up is due."
console.log(res.recent_interactions);        // [{ channel, occurred_at, summary }, ...]
console.log(res.open_followups);             // [{ id, action, due }, ...]
console.log(res.recommended_next_action);    // "Follow up with a proposal."
console.log(res.enriched);                   // true if external enrichment ran
```

Input:
- `contact` (required) — email, LinkedIn URL (`linkedin.com/in/slug`), phone (E.164), or @handle
- `enrich` (optional, default `true`) — set `false` for fast workspace-only lookup
- `also` (optional) — additional identifiers for the same person; guaranteed single merged contact

```typescript
// Fast workspace-only lookup:
const res = await nd.getContactInfo({ contact: 'jane@acme.com', enrich: false });

// Multi-identifier merge (email + LinkedIn URL → single contact):
const res = await nd.getContactInfo({
  contact: 'jane@acme.com',
  also: ['https://linkedin.com/in/janesmith'],
});
```

---

## nd.recordContactInteraction(input, options?)

Record an interaction. Optionally create a followup or complete existing ones in the same call. Unknown contacts are created on the fly.

```typescript
const res = await nd.recordContactInteraction({
  contact: 'jane@acme.com',
  channel: 'email',
  direction: 'outbound',
  summary: 'Sent intro about partnership',
  details: 'Hi Jane, I wanted to reach out...',  // optional: full body
  occurred_at: '2026-07-23T10:00:00Z',           // optional: defaults to now
  followup_action: 'Send proposal deck',
  followup_due: '2026-08-01',
  complete_followups: 'all',   // or array of IDs
}, { agent: 'sales-bot' });

console.log(res.interaction.id);        // "interaction_..."
console.log(res.followup_created);      // { id, action, due } | null
console.log(res.followups_completed);   // ["followup_..."]
console.log(res.contact_created);       // true if this was a new contact
```

Input:
- `contact` (required) — email, LinkedIn URL, phone, or @handle
- `summary` (required) — what happened, in plain language
- `channel` — `email` | `call` | `meeting` | `message` | `linkedin` | `twitter` | `other`
- `direction` — `inbound` | `outbound` | `unknown`
- `details` — full communication content (email body, transcript, notes). No length limit.
- `occurred_at` — ISO 8601 timestamp. Defaults to now. Use for historical backfill.
- `followup_action`, `followup_due`, `followup_agent` — creates a followup
- `complete_followups` — array of IDs or `"all"`
- `do_not_disturb` — `true` sets flag; `false` clears it

Options:
- `agent` — agent name stored with the interaction (overrides constructor default)

---

## nd.listOpenFollowups(params?)

All open followups with contact snippets. `do_not_disturb` is included on each contact so you can skip flagged contacts without extra lookups.

```typescript
const res = await nd.listOpenFollowups({
  due_before: '2026-08-01',   // optional — defaults to end of today
  owner: 'sales-bot',          // optional — filter by agent
  company: 'acme.com',         // optional — exact domain match
});

for (const f of res.followups) {
  if (f.contact.do_not_disturb) continue;  // skip DND contacts
  console.log(f.action, f.due, f.contact.name);
}
```

---

## nd.getCompanyActivity(input)

All contacts and interactions at a company. Strict domain match.

```typescript
const res = await nd.getCompanyActivity({ domain: 'anthropic.com' });

console.log(res.domain);           // "anthropic.com"
console.log(res.total_contacts);   // 3
for (const c of res.contacts) {
  console.log(c.name, c.interactions.length, c.do_not_disturb);
}
```

---

## nd.imports(input)

Bulk-upsert contacts, interactions, and follow-ups. Up to 5000 rows per call.

```typescript
const res = await nd.imports({
  rows: [
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
  ]
});

console.log(res.imported.contacts_created);      // 1
console.log(res.imported.interactions_created);  // 1
console.log(res.imported.followups_created);     // 1
console.log(res.errors);                         // []
```

---

## Verification loop

```typescript
// 1. Look up
const profile = await nd.getContactInfo({ contact: 'dario@anthropic.com' });
console.log(profile.contact.name);  // "Dario Amodei"

// 2. Record
await nd.recordContactInteraction({
  contact: 'dario@anthropic.com',
  summary: 'agent verified the nondual SDK setup',
});

// 3. Confirm the loop
const updated = await nd.getContactInfo({ contact: 'dario@anthropic.com' });
console.log(updated.recent_interactions[0].summary);  // appears — setup complete
```

---

## Links

- REST API: [api.md](./api.md)
- MCP setup: [mcp.md](./mcp.md)
- CLI: [cli.md](./cli.md)
- Agent onboarding: [agents.md](./agents.md)
- GitHub: https://github.com/nondual-agents/nondual
