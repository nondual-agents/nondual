/**
 * Nondual — Sales agent with do-not-disturb gate
 *
 * A sales agent that looks up every contact before outreach,
 * respects do_not_disturb, logs every touchpoint, and auto-creates
 * a follow-up when it sends an email.
 *
 * Usage:
 *   NONDUAL_API_KEY=nd_... npx tsx sales-agent.ts
 */
import { Nondual } from 'nondual';

const nd = new Nondual({ agent: 'sales-agent' });

interface Prospect {
  email: string;
  context?: string; // why we're reaching out
}

const PROSPECTS: Prospect[] = [
  { email: 'cto@acmecorp.com', context: 'Met at SaaStr 2026' },
  { email: 'founder@startupxyz.com', context: 'Inbound from website' },
  { email: 'vp.eng@bigco.com', context: 'Referral from Jane' },
];

async function processProspect(p: Prospect) {
  console.log(`\n--- ${p.email} ---`);

  // 1. Always look up before touching
  const info = await nd.getContactInfo({ contact: p.email }) as any;
  const c = info.contact;

  console.log(`Name:    ${c.name ?? '(unknown)'}`);
  console.log(`Role:    ${c.profile?.role ?? '(unknown)'}`);
  console.log(`Company: ${c.company?.name ?? '(unknown)'}`);

  // 2. Respect the flag — never reach out if set
  if (c.do_not_disturb) {
    console.log('⛔ DO NOT DISTURB — skipping.');
    return;
  }

  // 3. Check history — skip if already in active conversation
  if (info.open_followups?.length > 0) {
    const next = info.open_followups[0];
    console.log(`⏳ Has open followup: "${next.action}" — skipping fresh outreach.`);
    return;
  }

  // 4. Decide what to send based on relationship stage
  const summary = info.relationship_summary ?? '';
  const isFirstContact = !summary || summary.includes('No interactions');

  const emailSummary = isFirstContact
    ? `Sent first intro email — ${p.context ?? 'cold outreach'}`
    : `Sent follow-up email based on prior conversation`;

  // 5. Simulate sending email (replace with your email provider)
  console.log(`📧 Sending: ${emailSummary}`);

  // 6. Record it immediately + create a follow-up
  const recorded = await nd.recordContactInteraction({
    contact: p.email,
    channel: 'email',
    direction: 'outbound',
    summary: emailSummary,
    followup_action: 'Check for reply and follow up if none in 5 days',
    followup_due: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  }) as any;

  console.log(`✅ Logged: ${recorded.interaction.id}`);
  if (recorded.followup_created) {
    console.log(`📌 Followup: ${recorded.followup_created.action} by ${recorded.followup_created.due?.slice(0, 10)}`);
  }
}

async function main() {
  console.log('=== Sales agent run ===\n');

  // Check what's already due before starting
  const due = await nd.listOpenFollowups({
    due_before: new Date().toISOString().slice(0, 10),
  }) as any;

  if (due.followups?.length > 0) {
    console.log(`📋 ${due.followups.length} follow-up(s) due today:`);
    for (const f of due.followups) {
      console.log(`  ${f.contact?.name ?? f.contact?.identifiers?.emails?.[0]} — ${f.action}`);
    }
    console.log();
  }

  for (const prospect of PROSPECTS) {
    await processProspect(prospect);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
