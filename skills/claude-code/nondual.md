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

## MCP config (add to .claude/mcp.json or CLAUDE.md)

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

- **contacts_resolve(email)** — full profile from one email. Call before any outreach.
- **contacts_context(contact, purpose?)** — full history + recommended next step.
- **contacts_record(contact, channel, direction, summary)** — log every interaction.
- **contacts_followup(contact, action, due?)** — create a follow-up task.

## The loop

```
contacts_resolve("jane@acme.com")           # who is this?
contacts_record("jane@acme.com", channel: "email", direction: "outbound", summary: "...")
contacts_context("jane@acme.com")           # later: full history + next step
```

Full docs: https://nondual.cloud/docs
