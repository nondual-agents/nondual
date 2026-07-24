/**
 * Nondual — Daily followup digest
 *
 * Run this on a schedule (cron, GitHub Actions, etc.) to get a
 * daily digest of what needs attention. Checks what's due today,
 * groups by company, and outputs a prioritised action list.
 *
 * Usage:
 *   NONDUAL_API_KEY=nd_... npx tsx followup-digest.ts
 *
 * Cron (daily at 8am):
 *   0 8 * * * NONDUAL_API_KEY=nd_... npx tsx followup-digest.ts
 */
import { Nondual } from 'nondual';

const nd = new Nondual({ agent: 'digest-agent' });

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`=== Followup digest for ${today} ===\n`);

  const res = await nd.listOpenFollowups({ due_before: today }) as any;
  const followups = res.followups ?? [];

  if (followups.length === 0) {
    console.log('Nothing due today. ✅');
    return;
  }

  console.log(`${followups.length} open followup(s):\n`);

  // Group by company domain
  const byCompany = new Map<string, typeof followups>();
  for (const f of followups) {
    const domain = f.contact?.company?.domain ?? 'no company';
    if (!byCompany.has(domain)) byCompany.set(domain, []);
    byCompany.get(domain)!.push(f);
  }

  for (const [domain, items] of byCompany) {
    console.log(`── ${domain} ──`);
    for (const f of items) {
      const c = f.contact;
      const dnd = c?.do_not_disturb ? ' ⛔ DND' : '';
      const name = c?.name ?? c?.identifiers?.emails?.[0] ?? '?';
      const due = f.due ? f.due.slice(0, 10) : 'no date';
      const overdue = f.due && f.due < today ? ' ⚠️ OVERDUE' : '';
      console.log(`  ${name}${dnd}${overdue}`);
      console.log(`  → ${f.action} (due ${due})`);
      if (f.owner) console.log(`     owner: ${f.owner}`);
      console.log();
    }
  }

  // Overdue summary
  const overdue = followups.filter((f: any) => f.due && f.due < today);
  if (overdue.length > 0) {
    console.log(`⚠️  ${overdue.length} overdue — act today.`);
  }
}

main().catch(console.error);
