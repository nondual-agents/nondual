#!/usr/bin/env node
/**
 * nondual CLI
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
  const key = cfg.apiKey ?? process.env['NONDUAL_API_KEY'];
  return new Nondual({ apiKey: key, baseUrl: BASE_URL,
    agent: process.env['NONDUAL_AGENT'],
    agentUser: process.env['NONDUAL_AGENT_USER'],
  });
}

// ─── Output ───────────────────────────────────────────────────────────────────

function isJsonFlag(): boolean { return process.argv.includes('--json'); }

function printContact(contact: any): void {
  if (isJsonFlag()) { console.log(JSON.stringify(contact, null, 2)); return; }
  console.log(`\nName:     ${contact.name ?? '—'}`);
  if (contact.profile?.role) console.log(`Role:     ${contact.profile.role}`);
  if (contact.company?.name) console.log(`Company:  ${contact.company.name}`);
  if (contact.profile?.location) console.log(`Location: ${contact.profile.location}`);
  if (contact.identifiers?.linkedin_url) console.log(`LinkedIn: ${contact.identifiers.linkedin_url}`);
  if (contact.profile?.profiles?.github) console.log(`GitHub:   ${contact.profile.profiles.github}`);
  if (contact.profile?.profiles?.website) console.log(`Website:  ${contact.profile.profiles.website}`);
  if (contact.profile?.about) console.log(`\n${contact.profile.about}`);
  if (contact.relationship?.summary) console.log(`\nRelationship: ${contact.relationship.summary}`);
  if (contact.next?.action) console.log(`Next:     ${contact.next.action}`);
  if (contact._demo) console.log('\n(demo — sign up for a key: https://nondual.cloud)');
  console.log('');
}

function printContext(ctx: any): void {
  if (isJsonFlag()) { console.log(JSON.stringify(ctx, null, 2)); return; }
  if (ctx.profile) printContact(ctx.profile);
  if (ctx.relationship?.summary) console.log(`Relationship: ${ctx.relationship.summary}`);
  if (ctx.recent_interactions?.length) {
    console.log('\nRecent interactions:');
    for (const i of ctx.recent_interactions) {
      console.log(`  [${i.occurred_at?.slice(0, 10) ?? '?'}] ${i.recorded_by?.agent ?? 'unknown'} — ${i.summary}`);
    }
  }
  if (ctx.open_followups?.length) {
    console.log('\nOpen followups:');
    for (const f of ctx.open_followups) {
      console.log(`  ${f.action}${f.due ? ` (due ${f.due.slice(0, 10)})` : ''}`);
    }
  }
  if (ctx.next?.action) console.log(`\nNext: ${ctx.next.action}`);
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

async function cmdResolve(identifier: string): Promise<void> {
  if (!identifier) die('usage: nondual resolve <email|linkedin_url>');
  const client = getClient();
  const input = identifier.includes('linkedin.com') ? { linkedin_url: identifier } : { email: identifier };
  console.error('Resolving...');
  const res = await client.resolve(input) as any;
  printContact(res.contact ?? res);
}

async function cmdContext(identifier: string): Promise<void> {
  if (!identifier) die('usage: nondual context <email|linkedin_url>');
  const client = getClient();
  const res = await client.context({ contact: identifier }) as any;
  printContext(res.context ?? res);
}

async function cmdRecord(args: string[]): Promise<void> {
  // nondual record <email> --channel email --direction outbound --summary "..." [--agent name]
  const contact = args[0];
  if (!contact) die('usage: nondual record <email> --channel <channel> --direction <inbound|outbound> --summary "<text>"');
  const flags = parseFlags(args.slice(1));
  if (!flags['channel']) die('--channel required');
  if (!flags['direction']) die('--direction required (inbound|outbound)');
  if (!flags['summary']) die('--summary required');
  const client = getClient();
  await client.record({
    contact,
    channel: flags['channel']!,
    direction: flags['direction'] as 'inbound' | 'outbound',
    summary: flags['summary']!,
    occurred_at: flags['at'],
  });
  console.log('Recorded.');
}

async function cmdFollowup(args: string[]): Promise<void> {
  const contact = args[0];
  if (!contact) die('usage: nondual followup <email> --action "<text>" [--due <date>]');
  const flags = parseFlags(args.slice(1));
  if (!flags['action']) die('--action required');
  const client = getClient();
  const res = await client.createFollowup({ contact, action: flags['action']!, due: flags['due'] }) as any;
  if (isJsonFlag()) { console.log(JSON.stringify(res, null, 2)); return; }
  console.log(`Followup created: ${res.followup?.id ?? 'ok'}`);
}

async function cmdWhoami(): Promise<void> {
  const { apiKey, email } = readConfig();
  if (!apiKey) die('Not initialised. Run: nondual init');
  console.log(`Email:  ${email ?? '(unknown)'}`);
  console.log(`Key:    ${apiKey.slice(0, 8)}...`);
  console.log(`Config: ${CONFIG_PATH}`);
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
      case 'init':     await cmdInit(); break;
      case 'resolve':  await cmdResolve(rest[0] ?? ''); break;
      case 'context':  await cmdContext(rest[0] ?? ''); break;
      case 'record':   await cmdRecord(rest); break;
      case 'followup': await cmdFollowup(rest); break;
      case 'whoami':   await cmdWhoami(); break;
      default:
        console.log(`nondual — Your agents' system of record for every contact, conversation and next step.

Usage:
  nondual init                           Set up your API key
  nondual resolve <email>                Resolve a contact
  nondual context <email>                Get relationship context
  nondual record <email> --channel email --direction outbound --summary "..."
  nondual followup <email> --action "..." [--due 2026-08-01]
  nondual whoami                         Show current key

Flags:
  --json    Machine-readable JSON output

Docs: https://nondual.cloud/docs`);
    }
  } catch (err) {
    if (err instanceof NondualError) {
      die(`${err.code}: ${err.message}`);
    }
    throw err;
  }
}

main();
