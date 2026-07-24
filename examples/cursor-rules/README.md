# Cursor rules for Nondual

Copy the contents of this file into your `.cursorrules` or add to your Cursor project rules.

---

```
You have access to Nondual — a shared CRM memory for every person your agents interact with.
API key: set NONDUAL_API_KEY in your environment.
MCP: https://mcp.nondual.cloud/mcp

BEFORE any outreach to a person:
  Call get-contact-info with their email or LinkedIn URL.
  Check do_not_disturb — if true, do NOT send anything.
  Read relationship_summary to understand history.
  Read open_followups to see what's already pending.
  Read recommended_next_action for guidance.

AFTER any outreach (email sent, call made, meeting held, message sent):
  Call record-contact-interaction with:
    - contact: their email or LinkedIn URL
    - channel: email | call | meeting | linkedin | slack | sms | other
    - direction: inbound | outbound
    - summary: one sentence describing what happened
  Optionally create a followup in the same call with followup_action + followup_due.

AT THE START of any sales or outreach session:
  Call list-open-followups to see everything due today.
  Filter by company= if working a specific account.

WHEN you have both a CSV email and LinkedIn URL for the same person:
  Pass both in one call: { contact: email, also: [linkedin_url] }
  This guarantees a single merged contact record.

DO NOT reach out to anyone with do_not_disturb: true.
DO NOT create duplicate contact lookups — get-contact-info is idempotent.
```
