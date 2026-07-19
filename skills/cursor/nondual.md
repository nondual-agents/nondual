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

- `get_contact_info(contact, enrich?)` — full profile, relationship summary, open followups, recommended next action. Check `do_not_disturb` before outreach.
- `record_contact_interaction(contact, channel, summary, ...)` — log an interaction. Optionally create or complete followups in the same call.
- `list_open_followups(due_before?, company?, owner?)` — all open followups with contact snippets.
- `get_company_activity(domain)` — all contacts + interactions for a domain.

## When to use

- Before any outreach: `get_contact_info` — check `do_not_disturb`, see history, get recommended next action
- After any outreach: `record_contact_interaction` — log it, and optionally create the next followup
- On a schedule: `list_open_followups` — see what's due today
- For account research: `get_company_activity` — everyone at a domain, all interactions

Full docs: https://nondual.cloud/docs
