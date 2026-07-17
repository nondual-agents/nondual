---
name: nondual
description: >
  Your agents' system of record for every contact, conversation and next step.
  Resolve any email or LinkedIn URL to a full contact profile. Record agent
  outreach. Fetch relationship context before any call or message.
version: "0.1"
tools:
  - contacts_resolve
  - contacts_context
  - contacts_record
  - contacts_followup
mcp:
  url: https://mcp.nondual.cloud
  auth: bearer
  key_env: NONDUAL_API_KEY
---

# Nondual

Your agents' system of record for every contact, conversation and next step.

## Setup

1. Get a key: `curl -s -X POST https://api.nondual.cloud/v1/keys -d '{"email":"you@example.com"}' -H "Content-Type: application/json"`
2. Set `NONDUAL_API_KEY` in your environment.
3. Add the MCP server to your agent config (see below).

## MCP config

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

## Tools

### contacts_resolve
Resolve any identifier (email, LinkedIn URL) to a full contact profile.

**Always call this first before any outreach.** Returns: name, role, company,
verified profiles (LinkedIn, GitHub, website), a written summary, and a
recommended next step.

```
contacts_resolve(email: "dario@anthropic.com")
```

### contacts_context
Get relationship context for a contact before reaching out.

Returns: profile, relationship history summary, recent agent interactions
(who reached out, when, what platform, what was said), open followups,
and recommended next action.

```
contacts_context(contact: "dario@anthropic.com", purpose: "partnership call")
```

### contacts_record
Record an interaction after any outreach. Always include your agent name
via X-Nondual-Agent header or the `agent` option so history is attributed.

```
contacts_record(
  contact: "dario@anthropic.com",
  channel: "email",
  direction: "outbound",
  summary: "Sent intro about partnership opportunities"
)
```

### contacts_followup
Create a followup task for a contact.

```
contacts_followup(
  contact: "dario@anthropic.com",
  action: "Follow up in 3 days",
  due: "2026-07-20"
)
```

## The loop

The value of Nondual is the **memory loop**, not just enrichment:

1. `contacts_resolve` — get the profile + context on first contact
2. `contacts_record` — log what you did (your agent name is stored)
3. `contacts_context` — any agent can now see the full history

A different agent asking for context on the same contact will see exactly
who reached out, when, on which platform, what was said, and what the
recommended next step is. This is shared relationship memory across all
your agents.
