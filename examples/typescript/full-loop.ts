/**
 * Nondual full loop example — TypeScript v0.3.0
 * The memory loop in four calls.
 */
import { Nondual } from 'nondual';

const nd = new Nondual({
  apiKey: process.env['NONDUAL_API_KEY'],
  agent: 'my-agent',
});

async function main() {
  // 1. Get contact info before outreach — profile, history, do_not_disturb, recommended action
  console.log('Getting contact info...');
  const info = await nd.getContactInfo({ contact: 'dario@anthropic.com' }) as any;
  const contact = info.contact;

  console.log(`\nName:     ${contact.name}`);
  console.log(`Role:     ${contact.profile?.role}`);
  console.log(`Company:  ${contact.company?.name}`);
  if (contact.do_not_disturb) {
    console.log('\n⛔ DO NOT DISTURB — skipping outreach.');
    return;
  }
  console.log(`\nRelationship: ${info.relationship_summary}`);
  if (info.open_followups?.length) {
    console.log('\nOpen followups:');
    for (const f of info.open_followups) {
      console.log(`  ${f.action}${f.due ? ` (due ${f.due.slice(0, 10)})` : ''}`);
    }
  }
  console.log(`\nRecommended: ${info.recommended_next_action}`);

  // 2. Record outreach as sales-bot + create a followup in the same call
  console.log('\nRecording outreach as sales-bot...');
  const recorded = await nd.recordContactInteraction({
    contact: 'dario@anthropic.com',
    channel: 'email',
    direction: 'outbound',
    summary: 'Sent intro email about AI safety research partnership',
    followup_action: 'Follow up if no reply in 5 days',
    followup_due: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  }, { agent: 'sales-bot' }) as any;

  console.log(`Interaction: ${recorded.interaction.id}`);
  if (recorded.followup_created) {
    console.log(`Followup:    ${recorded.followup_created.id} — ${recorded.followup_created.action}`);
  }

  // 3. List open followups — what's due across all contacts?
  console.log('\nListing open followups...');
  const followupsRes = await nd.listOpenFollowups({ company: 'anthropic.com' }) as any;
  if (followupsRes.followups?.length) {
    console.log('\nOpen for anthropic.com:');
    for (const f of followupsRes.followups) {
      const dnd = f.contact?.do_not_disturb ? ' ⛔' : '';
      console.log(`  ${f.action}${f.due ? ` (due ${f.due.slice(0, 10)})` : ''} — ${f.contact?.name}${dnd}`);
    }
  }

  // 4. Later: get company-level view
  console.log('\nGetting company activity...');
  const activity = await nd.getCompanyActivity({ domain: 'anthropic.com' }) as any;
  console.log(`\n${activity.domain}: ${activity.total_contacts} contact(s)`);
  for (const c of activity.contacts ?? []) {
    const dnd = c.do_not_disturb ? ' ⛔' : '';
    console.log(`  ${c.name ?? '(unnamed)'}${c.profile?.role ? ` · ${c.profile.role}` : ''}${dnd}`);
  }
}

main().catch(console.error);
