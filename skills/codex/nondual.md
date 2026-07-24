# Nondual — Codex Agent Instructions

The address book for AI agents.

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
| `get_contact_info(contact, enrich?)` | Before any outreach. Full profile, history, `do_not_disturb`, recommended next action. |
| `record_contact_interaction(contact, channel, summary, ...)` | After every interaction. Optionally create/complete followups in the same call. |
| `list_open_followups(due_before?, company?)` | On a schedule. Returns what's due with contact snippets. |
| `get_company_activity(domain)` | For account research. All contacts + interactions at a domain. |

## Required pattern

Always run the full loop — never just get contact info:

```
get_contact_info → record_contact_interaction → list_open_followups
```

Check `contact.do_not_disturb` before sending any message.

Docs: https://nondual.cloud/docs
