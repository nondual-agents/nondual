/**
 * Nondual — Email triage agent (read inbound, log + decide)
 *
 * Pattern for an email-reading agent:
 *   1. Parse incoming email (sender, subject, body)
 *   2. Look up the sender in Nondual — get history + context
 *   3. Decide priority based on relationship + DND
 *   4. Log the inbound interaction
 *   5. Complete any open followup if the email is a reply
 *
 * Swap parsedEmail with your actual email provider
 * (Gmail API, Postmark inbound, etc.)
 *
 * Usage:
 *   NONDUAL_API_KEY=nd_... npx tsx email-triage.ts
 */
import { Nondual } from 'nondual';

const nd = new Nondual({ agent: 'email-triage' });

interface ParsedEmail {
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
}

// Simulated inbound email — replace with your provider's webhook payload
const parsedEmail: ParsedEmail = {
  from: 'cpo@partnerco.com',
  subject: 'Re: Partnership intro',
  body: "Hi, thanks for reaching out. I'd love to see a demo. What does next week look like for a call?",
  receivedAt: new Date().toISOString(),
};

async function triageEmail(email: ParsedEmail) {
  console.log(`\n📬 Inbound from: ${email.from}`);
  console.log(`   Subject: ${email.subject}\n`);

  // 1. Look up sender
  const info = await nd.getContactInfo({ contact: email.from }) as any;
  const c = info.contact;

  console.log(`Contact:      ${c.name ?? '(unknown)'}`);
  console.log(`Role:         ${c.profile?.role ?? '(unknown)'}`);
  console.log(`History:      ${info.relationship_summary ?? 'No prior contact'}`);
  console.log(`DND:          ${c.do_not_disturb}`);

  // 2. Priority logic based on relationship
  let priority = 'normal';
  if (info.open_followups?.length > 0) priority = 'high';   // we were waiting on them
  if (info.recent_interactions?.length === 0) priority = 'high'; // first ever reply

  console.log(`Priority:     ${priority}`);

  // 3. Find the followup this email closes (if any)
  const followupToClose = info.open_followups?.find((f: any) =>
    f.action.toLowerCase().includes('follow') ||
    f.action.toLowerCase().includes('reply')
  );

  // 4. Log the inbound
  const recorded = await nd.recordContactInteraction({
    contact: email.from,
    channel: 'email',
    direction: 'inbound',
    summary: `Inbound reply: "${email.subject}" — positive, wants demo call`,
    details: email.body,
    occurred_at: email.receivedAt,
    // Close the followup if we were waiting on a reply
    ...(followupToClose ? { complete_followups: [followupToClose.id] } : {}),
    // Create next followup
    followup_action: 'Schedule 30-min demo call',
    followup_due: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
  }) as any;

  console.log(`\n✅ Logged: ${recorded.interaction.id}`);
  if (followupToClose) {
    console.log(`✅ Closed followup: "${followupToClose.action}"`);
  }
  if (recorded.followup_created) {
    console.log(`📌 New followup: "${recorded.followup_created.action}"`);
  }

  // 5. Return triage result for your orchestration layer
  return {
    priority,
    contact: c,
    history: info.relationship_summary,
    recommended: info.recommended_next_action,
  };
}

triageEmail(parsedEmail).then(result => {
  console.log('\n=== Triage result ===');
  console.log(JSON.stringify(result, null, 2));
}).catch(console.error);
