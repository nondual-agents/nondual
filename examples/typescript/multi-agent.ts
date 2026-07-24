/**
 * Nondual — Multi-agent shared memory
 *
 * Demonstrates two agents (sales-bot and exec-bot) sharing the same
 * contact memory via a single API key. Agent A logs the outreach;
 * Agent B reads the full history weeks later.
 *
 * This is the core value proposition: ten agents, one team memory.
 *
 * Usage:
 *   NONDUAL_API_KEY=nd_... npx tsx multi-agent.ts
 */
import { Nondual } from 'nondual';

// Two agents — same key, same workspace, shared memory
const salesBot = new Nondual({ agent: 'sales-bot' });
const execBot  = new Nondual({ agent: 'exec-bot' });

async function main() {
  const contact = 'cpo@partnerco.com';

  // ── Agent A: sales-bot does outreach ──────────────────────────────────────
  console.log('=== sales-bot: initial outreach ===\n');

  const before = await salesBot.getContactInfo({ contact }) as any;
  console.log(`Before: ${before.relationship_summary ?? 'No history'}`);
  console.log(`DND: ${before.contact.do_not_disturb}`);

  if (!before.contact.do_not_disturb) {
    await salesBot.recordContactInteraction({
      contact,
      channel: 'email',
      direction: 'outbound',
      summary: 'Sent partnership intro — AI agent integration use case',
      details: 'Hi, reaching out about how Nondual could fit into your agent workflow. Happy to share more detail.',
      followup_action: 'Follow up if no reply by end of week',
      followup_due: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    });
    console.log('✅ Outreach logged by sales-bot');
  }

  // ── Agent B: exec-bot reads memory, decides next step ─────────────────────
  console.log('\n=== exec-bot: reviewing account before call ===\n');

  const after = await execBot.getContactInfo({ contact }) as any;
  const c = after.contact;

  console.log(`Name:         ${c.name}`);
  console.log(`Role:         ${c.profile?.role}`);
  console.log(`Company:      ${c.company?.name}`);
  console.log(`DND:          ${c.do_not_disturb}`);
  console.log(`History:      ${after.relationship_summary}`);
  console.log(`Recommended:  ${after.recommended_next_action}`);

  if (after.open_followups?.length) {
    console.log('\nOpen followups:');
    for (const f of after.open_followups) {
      console.log(`  ${f.action}${f.due ? ` (due ${f.due.slice(0, 10)})` : ''}`);
    }
  }

  if (after.recent_interactions?.length) {
    console.log('\nRecent interactions:');
    for (const i of after.recent_interactions) {
      console.log(`  [${i.channel}] ${i.summary}`);
      console.log(`   by ${i.recorded_by?.agent ?? 'unknown'} at ${i.occurred_at?.slice(0, 10)}`);
    }
  }

  // exec-bot logs its own touchpoint
  await execBot.recordContactInteraction({
    contact,
    channel: 'call',
    direction: 'inbound',
    summary: 'Inbound call — they want to see a demo of the agent integration',
    details: 'Called to follow up on the intro email. Very interested in the multi-agent memory use case. Asked for a demo.',
    followup_action: 'Send demo link and schedule 30-min walkthrough',
    followup_due: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    complete_followups: 'all', // close the sales-bot followup
  });

  console.log('\n✅ Call logged by exec-bot, sales-bot followup closed');
  console.log('\n→ Both agents now share the full timeline for this contact.');
}

main().catch(console.error);
