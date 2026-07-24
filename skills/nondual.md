---
name: nondual
description: >
  The address book for AI agents.
  Get full contact profiles before any outreach. Record every interaction.
  List open followups. Get company-level activity. Shared memory across all
  agents on the same key.
version: "0.3"
tools:
  - get_contact_info
  - record_contact_interaction
  - list_open_followups
  - get_company_activity
mcp:
  url: https://mcp.nondual.cloud
  auth: bearer
  key_env: NONDUAL_API_KEY
---

# Nondual

The address book for AI agents.

## Setup

1. Get a key:
```bash
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

2. Set the key:
```bash
export NONDUAL_API_KEY=nd_live_...
```

3. Add the MCP server to your agent config (see below).

## MCP config

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud",
      "headers": { "Authorization": "Bearer $NONDUAL_API_KEY" }
    }
  }
}
```

## Tools

### `get_contact_info`
Get the full contact profile: name, role, company, do_not_disturb flag, relationship summary, recent interactions, open followups, recommended next action.

**Call before any outreach.** Works without a key (3 free/day per IP) or with a key for workspace context.

```json
{
  "contact": "jane@acme.com",
  "enrich": true
}
```

Pass `also` when you have both an email and LinkedIn URL for the same person — guarantees a single merged contact:

```json
{
  "contact": "jane@acme.com",
  "also": ["https://linkedin.com/in/janesmith"],
  "enrich": true
}
```

Set `enrich: false` for a fast workspace-only lookup.

### `record_contact_interaction`
Record an interaction. Optionally create a followup or complete existing ones in the same call.

```json
{
  "contact": "jane@acme.com",
  "channel": "email",
  "direction": "outbound",
  "summary": "Sent intro about partnership",
  "details": "Full email body here...",
  "followup_action": "Send proposal deck",
  "followup_due": "2026-08-01",
  "complete_followups": "all"
}
```

`complete_followups` can be `"all"` or an array of followup IDs.

### `list_open_followups`
List all open followups with contact snippets. Checks `do_not_disturb` before outreach.

```json
{
  "due_before": "2026-08-01",
  "company": "acme.com"
}
```

### `get_company_activity`
All contacts and interactions for a domain. Exact match — no subdomains.

```json
{ "domain": "acme.com" }
```

## Workflow

```
get_contact_info(email)             → who is this? history? do_not_disturb?
record_contact_interaction(...)     → log interaction, create followup
list_open_followups()               → what's due? check do_not_disturb
record_contact_interaction(
  complete_followups: ["id"])       → close followup when done
```

## do_not_disturb

`contact.do_not_disturb = true` means don't reach out. Always check before outreach. Set it in `record_contact_interaction` with `"do_not_disturb": true`.

## Bulk import

Use `imports` to seed a workspace from a CSV or CRM export (up to 5000 rows per call):

```json
{
  "rows": [
    {
      "email": "jane@acme.com",
      "linkedin_url": "https://linkedin.com/in/janesmith",
      "name": "Jane Smith",
      "company": "Acme",
      "company_domain": "acme.com",
      "summary": "Met at SaaStr 2026",
      "channel": "meeting",
      "action": "Send follow-up",
      "due": "2026-08-01"
    }
  ]
}
```

Each row needs at least `email` or `linkedin_url`. Interaction written if `summary` + `channel` present. Followup written if `action` present.

## Docs

Full reference: https://nondual.cloud/docs
GitHub: https://github.com/nondual-agents/nondual
