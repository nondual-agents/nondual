# Nondual — Cursor Rules

Your agents' system of record for every contact, conversation and next step.

## Setup

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud",
      "headers": { "Authorization": "Bearer YOUR_NONDUAL_API_KEY" }
    }
  }
}
```

Get a key: `curl -s -X POST https://api.nondual.cloud/v1/keys -H "Content-Type: application/json" -d '{"email":"you@example.com"}'`

## Available tools

- `contacts_resolve(email)` — resolve any email to a full person profile
- `contacts_context(contact, purpose?)` — get full relationship history + next step
- `contacts_record(contact, channel, direction, summary)` — log an interaction
- `contacts_followup(contact, action, due?)` — create a follow-up task

## When to use

- Before any outreach: run `contacts_resolve` first, then `contacts_context`
- After any outreach: always run `contacts_record`
- When unsure what to do next: `contacts_context` returns a recommended action

Full docs: https://nondual.cloud/docs
