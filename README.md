# Nondual

Your agents' system of record for every contact, conversation and next step.

[![npm version](https://img.shields.io/npm/v/nondual.svg)](https://www.npmjs.com/package/nondual)
[![GitHub stars](https://img.shields.io/github/stars/nondual-agents/nondual.svg)](https://github.com/nondual-agents/nondual/stargazers)

---

One identifier in. A complete person out — name, role, company, verified profiles, a written summary, and a recommended next step. No forms. No data entry. No import.

Then record what happened and ask for context from a different agent. The response shows who reached out, when, on what platform, what was said, and what happens next. That is the product.

## Install

**MCP (Cursor, Claude Code, Hermes, Codex)**

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

**CLI**

```sh
npx nondual init
```

**TypeScript SDK**

```ts
import { Nondual } from 'nondual';
const nd = new Nondual();
const contact = await nd.contacts.resolve({ email: 'jane@acme.com' });
```

**cURL**

```sh
curl -X POST https://api.nondual.cloud/v1/resolve \
  -H "Authorization: Bearer $NONDUAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@acme.com"}'
```

## Get a key

```sh
curl -X POST https://api.nondual.cloud/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com"}'
```

Returns a working key instantly. No password. No credit card.

## Docs

[nondual.cloud/docs](https://nondual.cloud/docs)

## License

MIT
