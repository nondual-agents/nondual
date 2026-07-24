# Examples

Runnable examples for common Nondual use cases. Every file is self-contained.

## TypeScript

| File | What it shows |
|---|---|
| [`full-loop.ts`](./typescript/full-loop.ts) | The four-call memory loop — the core pattern |
| [`sales-agent.ts`](./typescript/sales-agent.ts) | Sales agent with DND gate, history check, followup creation |
| [`multi-agent.ts`](./typescript/multi-agent.ts) | Two agents sharing the same contact memory |
| [`followup-digest.ts`](./typescript/followup-digest.ts) | Daily digest of open followups, grouped by company |
| [`email-triage.ts`](./typescript/email-triage.ts) | Inbound email agent — look up sender, log, close followup |
| [`csv-import.ts`](./typescript/csv-import.ts) | Import a LinkedIn connections CSV with identity merge |

**Run any example:**
```bash
NONDUAL_API_KEY=nd_... npx tsx examples/typescript/<file>.ts
```

## Python

| File | What it shows |
|---|---|
| [`rest-loop.py`](./python/rest-loop.py) | The full memory loop via REST — no SDK |
| [`linkedin-import.py`](./python/linkedin-import.py) | Import a LinkedIn connections CSV |
| [`followup-digest.py`](./python/followup-digest.py) | Daily followup digest |

**Run any example:**
```bash
pip install requests
NONDUAL_API_KEY=nd_... python examples/python/<file>.py
```

## Prompt templates

[`prompts/README.md`](./prompts/README.md) — Copy-paste system prompts for 6 use cases:

1. Minimal — any agent, any use case
2. Sales agent — full context
3. Executive assistant — meeting prep + debrief
4. Recruiting agent — candidate pipeline
5. Investor relations — LP communications
6. LinkedIn import — one-time setup task

## Cursor rules

[`cursor-rules/README.md`](./cursor-rules/README.md) — Drop-in `.cursorrules` for Cursor agents.

---

## Get a key

```bash
curl -s -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

Or: [nondual.cloud](https://nondual.cloud)
