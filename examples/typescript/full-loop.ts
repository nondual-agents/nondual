/**
 * Nondual full loop example — TypeScript
 * The wow in two beats: resolve a contact, record outreach, fetch context.
 */
import { Nondual } from 'nondual';

const nd = new Nondual({
  apiKey: process.env['NONDUAL_API_KEY'],
  agent: 'my-agent',
});

async function main() {
  // Beat 1: Resolve
  console.log('Resolving contact...');
  const { contact } = await nd.resolve({ email: 'dario@anthropic.com' }) as any;
  console.log(`\nName:    ${contact.name}`);
  console.log(`Role:    ${contact.profile.role}`);
  console.log(`Company: ${contact.company?.name}`);
  console.log(`Summary: ${contact.profile.about}`);
  console.log(`Next:    ${contact.next?.action}`);

  // Beat 2: Record outreach as agent "sales-bot"
  console.log('\nRecording outreach as sales-bot...');
  await nd.record({
    contact: 'dario@anthropic.com',
    channel: 'email',
    direction: 'outbound',
    summary: 'Sent intro email about AI safety research partnership',
  }, { agent: 'sales-bot' });

  // Beat 2: Fetch context as agent "research-bot" — sees the history
  console.log('\nFetching context as research-bot...');
  const { context } = await nd.context(
    { contact: 'dario@anthropic.com', purpose: 'follow-up call' },
    { agent: 'research-bot' },
  ) as any;

  console.log('\nRelationship:', context.relationship?.summary);
  if (context.recent_interactions?.length) {
    console.log('\nRecent interactions:');
    for (const i of context.recent_interactions) {
      console.log(`  [${i.occurred_at?.slice(0,10)}] ${i.recorded_by?.agent}: ${i.summary}`);
    }
  }
  console.log('\nRecommended next step:', context.next?.action);
}

main().catch(console.error);
