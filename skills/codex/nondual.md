# Nondual — Codex Agent Instructions

Your agents' system of record for every contact, conversation and next step.

## Install

```bash
export NONDUAL_API_KEY=$(curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}' | jq -r .api_key)
```

## MCP setup

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

## Tools and when to call them

| Tool | When |
|---|---|
| `contacts_resolve(email)` | Before any outreach. Returns full profile. |
| `contacts_context(contact)` | Before any message. Returns history + next step. |
| `contacts_record(contact, channel, direction, summary)` | After every interaction. |
| `contacts_followup(contact, action, due?)` | When a follow-up is needed. |

## Required pattern

Always run the full loop — never just resolve:

```
contacts_resolve → contacts_record → contacts_context
```

Docs: https://nondual.cloud/docs
