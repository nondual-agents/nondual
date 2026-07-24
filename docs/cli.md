# Nondual CLI

The address book for AI agents.

Run commands directly from your terminal or agent shell. No config file needed to start.

---

## Install

```bash
# Use without installing
npx nondual <command>

# Or install globally
npm install -g nondual
```

---

## nondual init

Store your API key in `~/.nondual`. All subsequent commands read it from there.

```bash
npx nondual init
# Prompts for email, creates a key, stores it locally
# Check your email to verify and unlock higher limits

# Agent path — key returned in JSON, no inbox visit required:
npx nondual init --agent --email you@example.com
```

---

## nondual get-contact-info \<identifier\>

Get the full contact profile: name, role, company, relationship summary, recent interactions, open followups, and recommended next action. Check `do_not_disturb` before any outreach.

```bash
npx nondual get-contact-info dario@anthropic.com

# Name:     Dario Amodei
# Role:     Co-Founder & CEO
# Company:  Anthropic
# LinkedIn: https://linkedin.com/in/darioamodei
#
# Relationship: 2 interactions. Follow-up is due.
# Recommended: Follow up with a concrete proposal.
```

Identifiers accepted: email, LinkedIn URL (`linkedin.com/in/slug`), phone (E.164), @handle.

Flags:
- `--enrich false` — skip external enrichment, workspace-only, instant
- `--json` — machine-readable JSON output (default)
- `--plain` — human-readable text output

---

## nondual record-contact-interaction \<identifier\>

Record an interaction after outreach. Creates the contact if it doesn't exist yet.

```bash
npx nondual record-contact-interaction dario@anthropic.com \
  --summary "Sent intro about partnership" \
  --channel email \
  --direction outbound

# With a followup:
npx nondual record-contact-interaction dario@anthropic.com \
  --summary "Discussed partnership on call" \
  --channel call \
  --followup "Send proposal deck" \
  --followup-due 2026-08-01

# Complete all open followups at the same time:
npx nondual record-contact-interaction dario@anthropic.com \
  --summary "Sent the proposal" \
  --channel email \
  --complete all
```

| Flag | Required | Values | Description |
|---|---|---|---|
| `--summary` | yes | string | What happened |
| `--channel` | no | `email` `call` `meeting` `linkedin` `slack` `sms` `other` | Communication channel |
| `--direction` | no | `inbound` `outbound` `unknown` | Who initiated (default: `outbound`) |
| `--details` | no | string | Full body — email, transcript, notes |
| `--details-file` | no | path | File whose contents become `details` |
| `--followup` | no | string | Create a followup with this action text |
| `--followup-due` | no | ISO date | Due date for the followup |
| `--complete` | no | `all` or comma-separated IDs | Complete followups in the same call |
| `--dnd` | no | `true` / `false` | Set or clear do_not_disturb |
| `--json` | no | — | Machine-readable JSON output |

---

## nondual list-open-followups

List open followups due today. Shows `⛔` for do-not-disturb contacts.

```bash
npx nondual list-open-followups
npx nondual list-open-followups --due-before 2026-08-01
npx nondual list-open-followups --company anthropic.com
npx nondual list-open-followups --owner sales-agent
npx nondual list-open-followups --json
```

Flags: `--due-before`, `--owner`, `--company`, `--json`

---

## nondual get-company-activity \<domain\>

All contacts and recent interactions for a company domain.

```bash
npx nondual get-company-activity anthropic.com
npx nondual get-company-activity anthropic.com --json
```

---

## nondual search \<query\>

Search contacts by name, company, or email.

```bash
npx nondual search "anthropic"
npx nondual search "dario"
```

---

## nondual whoami

Show the active key and its source.

```bash
npx nondual whoami

# Email:  you@example.com
# Key:    nd_12cb94...
# Source: ~/.nondual/config.json
```

---

## Verification loop

```bash
npx nondual get-contact-info dario@anthropic.com
npx nondual record-contact-interaction dario@anthropic.com \
  --summary "agent verified the nondual CLI setup"
npx nondual get-contact-info dario@anthropic.com
# Interaction appears in the timeline — setup is complete
```

---

## Links

- REST API: [api.md](./api.md)
- MCP setup: [mcp.md](./mcp.md)
- TypeScript SDK: [sdk.md](./sdk.md)
- Agent onboarding: [agents.md](./agents.md)
- GitHub: https://github.com/nondual-agents/nondual
