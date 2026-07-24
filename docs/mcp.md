# Nondual MCP

Your agents' system of record for every contact, conversation and next step.

Add one JSON block to your MCP config. All four tools appear immediately in Cursor, Claude Desktop, Hermes, or any MCP-compatible client.

---

## Config

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

Replace `YOUR_API_KEY` with your key from https://nondual.cloud/login.  
Both `https://mcp.nondual.cloud/mcp` and `https://mcp.nondual.cloud` are accepted.

Get a key:

```bash
npx nondual init
```

---

## Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

Restart Cursor. The four tools appear in Agent mode automatically.

## Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nondual": {
      "url": "https://mcp.nondual.cloud/mcp",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}
```

## Hermes

Add to your Hermes config or pass as a skill. The `skills/hermes/nondual.md` file in this repo is the ready-to-use Hermes skill.

---

## Tools

### get_contact_info

Get the full contact profile before any outreach. Returns name, role, company, `do_not_disturb` flag, relationship summary, recent interactions, open followups, and recommended next action.

Works without a key (3 free per day per IP) or with a key for workspace context.

```
get_contact_info(contact: "jane@acme.com")
get_contact_info(contact: "jane@acme.com", enrich: false)   // workspace-only, instant
get_contact_info(contact: "jane@acme.com", also: ["https://linkedin.com/in/janesmith"])
```

Input:
- `contact` (required) — email, LinkedIn URL, phone number, or @handle
- `enrich` (optional, default true) — set false for a fast workspace-only lookup
- `also` (optional) — additional identifiers for the same person; merged into one contact

### record_contact_interaction

Record an interaction after outreach. Your agent name is stored with it. Optionally create a followup or complete existing ones in the same call.

```
record_contact_interaction(
  contact: "jane@acme.com",
  summary: "Sent pricing overview",
  channel: "email",
  direction: "outbound",
  details: "Hi Jane, following up with the pricing overview we discussed. Let me know if you have questions.",
  followup_action: "Send proposal deck",
  followup_due: "2026-08-01"
)
```

Input:
- `contact` (required) — email, LinkedIn URL, phone, or @handle
- `summary` (required) — what happened, in plain language
- `channel` — `email` | `call` | `meeting` | `message` | `linkedin` | `twitter` | `other`
- `direction` — `inbound` | `outbound` | `unknown`
- `details` — full content of the communication: email body, transcript, meeting notes. No length limit.
- `agent` — name of the calling agent (stored with the interaction)
- `followup_action`, `followup_due`, `followup_agent` — creates a followup in the same call
- `complete_followups` — array of followup IDs, or `"all"`
- `do_not_disturb` — `true` sets the flag; `false` clears it

### list_open_followups

All open followups with contact snippets. Start-of-day call.

```
list_open_followups()
list_open_followups(due_before: "2026-08-01", owner: "sales-agent", company: "acme.com")
```

Input (all optional):
- `due_before` — ISO date, defaults to end of today
- `owner` — agent name
- `company` — domain name

### get_company_activity

All contacts and interactions at a company.

```
get_company_activity(domain: "anthropic.com")
```

Input:
- `domain` (required) — company domain name

---

## Verification

After adding the config, verify the tools are working:

```
get_contact_info(contact: "dario@anthropic.com")
record_contact_interaction(
  contact: "dario@anthropic.com",
  summary: "agent verified nondual MCP setup"
)
```

You should get a full profile for Dario and a confirmation that the interaction was recorded. Call `get_contact_info` again — the interaction appears in `recent_interactions`. Setup is complete.

---

## Links

- REST API: [api.md](./api.md)
- CLI: [cli.md](./cli.md)
- TypeScript SDK: [sdk.md](./sdk.md)
- Agent onboarding: [agents.md](./agents.md)
- GitHub: https://github.com/nondual-agents/nondual
