# Nondual — Claude Code Skill

Your agents' system of record for every contact, conversation and next step.

## Install

```bash
# Get a key
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'

export NONDUAL_API_KEY=nd_live_...
```

## MCP config (add to `.claude/mcp.json` or `CLAUDE.md`)

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

- **get_contact_info(contact, enrich?)** — full profile, relationship summary, open followups, recommended next action. Check `do_not_disturb` before outreach.
- **record_contact_interaction(contact, channel, summary, ...)** — log interaction. Optionally create a followup or complete existing ones in the same call.
- **list_open_followups(due_before?, company?, owner?)** — all open followups with contact snippets.
- **get_company_activity(domain)** — all contacts + interactions for a domain.

## Workflow

```
get_contact_info("jane@acme.com")         → who is this? history? safe to contact?
record_contact_interaction(               → log interaction + create followup
  contact="jane@acme.com",
  channel="email", summary="Sent intro",
  followup_action="Follow up next week")
list_open_followups(due_before="2026-08-01")   → what's due?
record_contact_interaction(complete_followups=["id"])   → close when done
```

## Docs

https://nondual.cloud/docs
