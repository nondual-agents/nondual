#!/usr/bin/env node
/**
 * nondual CLI — v0.3.0
 * Your agents' system of record for every contact, conversation and next step.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { Nondual, NondualError } from '../client.js';

const CONFIG_PATH = path.join(os.homedir(), '.nondual', 'config.json');
const BASE_URL = process.env['NONDUAL_BASE_URL'] ?? 'https://api.nondual.cloud/v1';

// ─── Config ───────────────────────────────────────────────────────────────────

function readConfig(): { apiKey?: string; email?: string } {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
  catch { return {}; }
}

function writeConfig(cfg: { apiKey?: string; email?: string }): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function getClient(): Nondual {
  const cfg = readConfig();
  const key = process.env['NONDUAL_API_KEY'] ?? cfg.apiKey;
  return new Nondual({
    apiKey: key,
    baseUrl: BASE_URL,
    agent: process.env['NONDUAL_AGENT'],
    agentUser: process.env['NONDUAL_AGENT_USER'],
  });
}

// ─── Output helpers ───────────────────────────────────────────────────────────

function isPlainFlag(): boolean { return process.argv.includes('--plain'); }

function printContact(contact: any): void {
  if (!isPlainFlag()) { console.log(JSON.stringify(contact, null, 2)); return; }
  console.log(`\nName:     ${contact.name ?? '—'}`);
  if (contact.do_not_disturb) console.log('Status:   ⛔ DO NOT DISTURB');
  if (contact.profile?.role) console.log(`Role:     ${contact.profile.role}`);
  if (contact.company?.name) console.log(`Company:  ${contact.company.name}`);
  if (contact.profile?.location) console.log(`Location: ${contact.profile.location}`);
  if (contact.identifiers?.linkedin_url) console.log(`LinkedIn: ${contact.identifiers.linkedin_url}`);
  if (contact.profile?.profiles?.github) console.log(`GitHub:   ${contact.profile.profiles.github}`);
  if (contact.profile?.profiles?.website) console.log(`Website:  ${contact.profile.profiles.website}`);
  if (contact.profile?.about) console.log(`\n${contact.profile.about}`);
  if (contact.relationship?.summary) console.log(`\nRelationship: ${contact.relationship.summary}`);
  if (contact.next?.action) console.log(`Next:     ${contact.next.action}`);
  console.log('');
}

function printGetContactInfo(res: any): void {
  if (!isPlainFlag()) { console.log(JSON.stringify(res, null, 2)); return; }
  if (res.contact) printContact(res.contact);
  if (res.relationship_summary) console.log(`Relationship: ${res.relationship_summary}`);
  if (res.recent_interactions?.length) {
    console.log('\nRecent interactions:');
    for (const i of res.recent_interactions) {
      console.log(`  [${i.occurred_at?.slice(0, 10) ?? '?'}] ${i.recorded_by?.agent ?? 'unknown'} — ${i.summary}`);
    }
  }
  if (res.open_followups?.length) {
    console.log('\nOpen followups:');
    for (const f of res.open_followups) {
      console.log(`  ${f.action}${f.due ? ` (due ${f.due.slice(0, 10)})` : ''}`);
    }
  }
  if (res.recommended_next_action) console.log(`\nRecommended: ${res.recommended_next_action}`);
  if (!res.enriched) console.log('(served from cache — no live vendor call this request)');
  console.log('');
}

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdInit(): Promise<void> {
  let { apiKey, email } = readConfig();
  if (apiKey) {
    console.log(`Already initialised (${email ?? 'key stored'}). Run \`nondual whoami\` to verify.`);
    return;
  }
  email = await prompt('Email address: ');
  if (!email) die('email required');
  console.log('Creating key...');
  const res = await Nondual.createKey(email, BASE_URL) as any;
  apiKey = res.api_key ?? res.key ?? res.apiKey;
  if (!apiKey) die(`Unexpected response: ${JSON.stringify(res)}`);
  writeConfig({ apiKey, email });
  console.log(`\nKey stored in ${CONFIG_PATH}`);
  console.log('Check your email to verify and unlock higher limits.\n');
  console.log('⭐ Star the repo: https://github.com/nondual-agents/nondual');
}

async function cmdGetContactInfo(identifier: string, flags: Record<string, string | undefined>): Promise<void> {
  if (!identifier) die('usage: nondual get-contact-info <email|linkedin_url|phone|@handle>');
  const client = getClient();
  const enrich = flags['enrich'] !== 'false';
  if (isPlainFlag()) console.error('Fetching contact info...');
  const res = await client.getContactInfo({ contact: identifier, enrich });
  printGetContactInfo(res);
}

async function cmdRecord(args: string[]): Promise<void> {
  const contact = args[0];
  if (!contact) die('usage: nondual record <email> --channel email --direction outbound --summary "..." [--details "..." | --details-file path] [--followup "..." --due date] [--complete <id|all>]');
  const flags = parseFlags(args.slice(1));
  if (!flags['channel']) die('--channel required');
  if (!flags['summary']) die('--summary required');

  let details: string | undefined;
  if (flags['details-file']) {
    const { readFileSync } = await import('fs');
    details = readFileSync(flags['details-file']!, 'utf8');
  } else if (flags['details']) {
    details = flags['details'];
  }

  const completeRaw = flags['complete'];
  const completeFollowups = completeRaw === 'all' ? 'all'
    : completeRaw ? completeRaw.split(',').map(s => s.trim())
    : undefined;

  const client = getClient();
  const res = await client.recordContactInteraction({
    contact,
    channel: flags['channel']! as any,
    direction: (flags['direction'] ?? 'outbound') as any,
    summary: flags['summary']!,
    details,
    occurred_at: flags['at'],
    followup_action: flags['followup'],
    followup_due: flags['due'],
    followup_agent: flags['followup-agent'],
    complete_followups: completeFollowups,
    do_not_disturb: flags['dnd'] !== undefined ? flags['dnd'] !== 'false' : undefined,
  }) as any;

  if (!isPlainFlag()) { console.log(JSON.stringify(res, null, 2)); return; }
  console.log(`Interaction recorded: ${res.interaction?.id ?? 'ok'}`);
  if (res.followup_created) console.log(`Followup created:     ${res.followup_created.id}`);
  if (res.followups_completed?.length) console.log(`Followups completed:  ${res.followups_completed.join(', ')}`);
  if (res.contact_created) console.log(`Contact created (thin)`);
}

async function cmdListFollowups(flags: Record<string, string | undefined>): Promise<void> {
  const client = getClient();
  const params: any = {};
  if (flags['due-before']) params.due_before = flags['due-before'];
  if (flags['owner']) params.owner = flags['owner'];
  if (flags['company']) params.company = flags['company'];
  const data = await client.listOpenFollowups(params) as any;
  if (!isPlainFlag()) { console.log(JSON.stringify(data, null, 2)); return; }
  const followups = data.followups ?? [];
  if (!followups.length) { console.log('No open followups.'); return; }
  console.log(`\n${followups.length} open followup(s):\n`);
  for (const f of followups) {
    const dnd = f.contact?.do_not_disturb ? ' ⛔' : '';
    const due = f.due ? ` (due ${f.due.slice(0, 10)})` : '';
    const name = f.contact?.name ?? f.contact?.email ?? f.contact?.id ?? '?';
    console.log(`  ${f.action}${due}  — ${name}${dnd}`);
  }
  console.log('');
}

async function cmdCompanyActivity(domain: string): Promise<void> {
  if (!domain) die('usage: nondual company-activity <domain>');
  const client = getClient();
  const data = await client.getCompanyActivity({ domain }) as any;
  if (!isPlainFlag()) { console.log(JSON.stringify(data, null, 2)); return; }
  const contacts = data.contacts ?? [];
  console.log(`\nActivity for ${domain}: ${contacts.length} contact(s)\n`);
  for (const c of contacts) {
    const dnd = c.do_not_disturb ? ' ⛔' : '';
    const role = c.profile?.role ? ` · ${c.profile.role}` : '';
    console.log(`  ${c.name ?? '(unnamed)'}${role}${dnd}`);
    if (c.interactions?.length) {
      for (const i of c.interactions.slice(0, 3)) {
        console.log(`    [${i.occurred_at?.slice(0, 10) ?? '?'}] ${i.channel} ${i.direction}: ${i.summary}`);
      }
    }
  }
  console.log('');
}

async function cmdWhoami(): Promise<void> {
  const cfg = readConfig();
  const envKey = process.env['NONDUAL_API_KEY'];
  const apiKey = envKey ?? cfg.apiKey;
  const email = cfg.email;
  if (!apiKey) die('Not initialised. Run: nondual init');
  const source = envKey ? 'NONDUAL_API_KEY env var' : CONFIG_PATH;
  console.log(`Email:  ${email ?? '(unknown)'}`);
  console.log(`Key:    ${apiKey.slice(0, 8)}...`);
  console.log(`Source: ${source}`);
}

async function cmdSearch(query: string): Promise<void> {
  if (!query) die('Usage: nondual search <query>');
  const client = getClient();
  const data = await client.searchContacts(query);
  if (!isPlainFlag()) { console.log(JSON.stringify(data, null, 2)); return; }
  const contacts = (data as any).contacts ?? [];
  if (!contacts.length) { console.log('No contacts found.'); return; }
  console.log(`\nFound ${contacts.length} contact(s):\n`);
  for (const c of contacts) {
    const email = c.identifiers?.emails?.[0] ?? '—';
    const role = c.profile?.role ? ` · ${c.profile.role}` : '';
    const co = c.company?.name ? ` @ ${c.company.name}` : '';
    const dnd = c.do_not_disturb ? ' ⛔' : '';
    console.log(`  ${c.name ?? '(unnamed)'}${role}${co}  <${email}>${dnd}`);
  }
  console.log('');
}

async function cmdImport(filePath: string): Promise<void> {
  if (!filePath) die('Usage: nondual import <file.csv|file.jsonl>');
  if (!fs.existsSync(filePath)) die(`File not found: ${filePath}`);

  const content = fs.readFileSync(filePath, 'utf8').trim();
  const ext = path.extname(filePath).toLowerCase();
  let rows: Record<string, string>[] = [];

  if (ext === '.jsonl' || ext === '.ndjson') {
    rows = content.split('\n').filter(Boolean).map(l => JSON.parse(l));
  } else if (ext === '.csv') {
    const lines = content.split('\n');
    const headers = (lines[0] ?? '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    rows = lines.slice(1).filter(Boolean).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { if (h && vals[i] !== undefined) row[h] = vals[i]!; });
      return row;
    });
  } else {
    die('Unsupported format. Use .csv or .jsonl');
  }

  if (!rows.length) die('No rows found in file');
  console.log(`Importing ${rows.length} row(s) from ${path.basename(filePath)}...`);

  const client = getClient();
  const result = await client.importContacts(rows);
  if (!isPlainFlag()) { console.log(JSON.stringify(result, null, 2)); return; }
  const imp = (result as any).imported ?? {};
  console.log(`\n✓ Import complete`);
  console.log(`  Contacts created: ${imp.contacts_created ?? 0}`);
  console.log(`  Contacts updated: ${imp.contacts_updated ?? 0}`);
  console.log(`  Interactions:     ${imp.interactions_created ?? 0}`);
  console.log(`  Follow-ups:       ${imp.followups_created ?? 0}`);
  const errs = (result as any).errors ?? [];
  if (errs.length) {
    console.log(`  Errors (first ${errs.length}):`);
    errs.slice(0, 5).forEach((e: any) => console.log(`    row ${e.row}: ${e.error}`));
  }
  console.log('');
}

// ─── Flag parser ──────────────────────────────────────────────────────────────

function parseFlags(args: string[]): Record<string, string | undefined> {
  const flags: Record<string, string | undefined> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i]?.startsWith('--')) {
      const key = args[i]!.slice(2);
      flags[key] = args[i + 1] ?? 'true';
      i++;
    }
  }
  return flags;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const [,, cmd, ...rest] = process.argv;

async function main(): Promise<void> {
  try {
    switch (cmd) {
      case 'init':               await cmdInit(); break;
      case 'get-contact-info':   await cmdGetContactInfo(rest[0] ?? '', parseFlags(rest.slice(1))); break;
      // Canonical CR-0001 names
      case 'record-contact-interaction': await cmdRecord(rest); break;
      case 'list-open-followups':        await cmdListFollowups(parseFlags(rest)); break;
      case 'get-company-activity':       await cmdCompanyActivity(rest[0] ?? ''); break;
      // Deprecated aliases (pre-0.3.0) — warn and delegate
      case 'record':
        console.error('warning: "record" is deprecated, use "record-contact-interaction"');
        await cmdRecord(rest); break;
      case 'followups':
        console.error('warning: "followups" is deprecated, use "list-open-followups"');
        await cmdListFollowups(parseFlags(rest)); break;
      case 'company-activity':
        console.error('warning: "company-activity" is deprecated, use "get-company-activity"');
        await cmdCompanyActivity(rest[0] ?? ''); break;
      case 'search':             await cmdSearch(rest[0] ?? ''); break;
      case 'import':             await cmdImport(rest[0] ?? ''); break;
      case 'whoami':             await cmdWhoami(); break;
      default:
        console.log(`nondual — Your agents' system of record for every contact, conversation and next step.

Usage:
  nondual init                                   Set up your API key
  nondual get-contact-info <email|url|phone>      Get full contact profile + relationship context
  nondual record-contact-interaction <email> \\
    --channel email --summary \"...\"               Record an interaction (and optionally a followup)
  nondual list-open-followups [--due-before date] List open followups
  nondual get-company-activity <domain>          All contacts + interactions for a company domain
  nondual search <query>                         Search contacts by name, company, email
  nondual import <file.csv|file.jsonl>           Bulk import contacts
  nondual whoami                                 Show current key and email

Flags:
  --plain   Human-readable text output (default: pretty JSON)

Docs: https://nondual.cloud/docs`);
        process.exit(1);
    }
  } catch (err) {
    if (err instanceof NondualError) {
      die(`${err.code}: ${err.message}`);
    }
    throw err;
  }
}

main();
