/**
 * Nondual SDK client — v0.3.0
 * Your agents' system of record for every contact, conversation and next step.
 */

const DEFAULT_BASE_URL = 'https://api.nondual.cloud/v1';

export interface NondualOptions {
  apiKey?: string;
  baseUrl?: string;
  agent?: string;
  agentUser?: string;
}

// ─── V2 input types ───────────────────────────────────────────────────────────

export interface GetContactInfoInput {
  contact: string;  // email, LinkedIn URL, phone number, or @handle
  enrich?: boolean; // default true — set false for a fast workspace-only lookup
}

export interface RecordContactInteractionInput {
  contact: string;  // email, LinkedIn URL, phone number, or @handle
  channel: 'email' | 'linkedin' | 'slack' | 'call' | 'meeting' | 'sms' | 'other';
  direction: 'outbound' | 'inbound' | 'unknown';
  summary: string;  // one sentence
  details?: string; // full content — email body, transcript, notes. No length limit.
  occurred_at?: string; // ISO 8601; defaults to now
  participants?: string[];
  source?: { platform?: string; external_id?: string };
  recorded_by?: { agent?: string; user?: string };
  followup_action?: string;   // create a followup in the same call
  followup_due?: string;      // ISO 8601 date
  followup_agent?: string;    // who owns the followup
  complete_followups?: string[] | 'all'; // followup IDs to complete, or 'all'
  do_not_disturb?: boolean;   // set or clear the do-not-disturb flag
}

export interface ListOpenFollowupsInput {
  due_before?: string; // ISO 8601 date
  owner?: string;      // filter by owner (agent name or id)
  company?: string;    // filter by company domain (exact match)
}

export interface GetCompanyActivityInput {
  domain: string; // e.g. "acme.com" — exact match, no subdomains
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class NondualError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'NondualError';
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class Nondual {
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly defaultAgent: string | undefined;
  private readonly defaultAgentUser: string | undefined;

  constructor(options: NondualOptions = {}) {
    this.apiKey = options.apiKey ?? process.env['NONDUAL_API_KEY'];
    this.baseUrl = (options.baseUrl ?? process.env['NONDUAL_BASE_URL'] ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    this.defaultAgent = options.agent ?? process.env['NONDUAL_AGENT'];
    this.defaultAgentUser = options.agentUser ?? process.env['NONDUAL_AGENT_USER'];
  }

  private headers(agent?: string, agentUser?: string): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`;
    const a = agent ?? this.defaultAgent;
    const u = agentUser ?? this.defaultAgentUser;
    if (a) h['X-Nondual-Agent'] = a;
    if (u) h['X-Nondual-Agent-User'] = u;
    return h;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    agent?: string,
    agentUser?: string,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(agent, agentUser),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = await res.json() as any;
    if (!res.ok) {
      throw new NondualError(res.status, json?.error ?? 'unknown_error', json?.message ?? `HTTP ${res.status}`);
    }
    return json as T;
  }

  // ─── get_contact_info ──────────────────────────────────────────────────────

  /** Get the full contact profile: name, role, company, relationship summary, recent interactions, open followups, recommended next action. */
  async getContactInfo(
    input: GetContactInfoInput,
    opts: { agent?: string; agentUser?: string } = {},
  ): Promise<any> {
    return this.request('POST', '/get-contact-info', input, opts.agent, opts.agentUser);
  }

  // ─── record_contact_interaction ───────────────────────────────────────────

  /** Record an interaction. Optionally create a followup or complete existing ones in the same call. */
  async recordContactInteraction(
    input: RecordContactInteractionInput,
    opts: { agent?: string; agentUser?: string } = {},
  ): Promise<any> {
    return this.request('POST', '/record-contact-interaction', input, opts.agent, opts.agentUser);
  }

  // ─── list_open_followups ──────────────────────────────────────────────────

  /** List open followups with contact snippets. Filter by due date, owner, or company domain. */
  async listOpenFollowups(
    params?: ListOpenFollowupsInput,
    opts: { agent?: string; agentUser?: string } = {},
  ): Promise<any> {
    const q = params ? new URLSearchParams(params as any).toString() : '';
    return this.request('GET', `/list-open-followups${q ? `?${q}` : ''}`, undefined, opts.agent, opts.agentUser);
  }

  // ─── get_company_activity ─────────────────────────────────────────────────

  /** Get all contacts and recent interactions for a company domain. Strict domain match. No enrichment. */
  async getCompanyActivity(
    input: GetCompanyActivityInput,
    opts: { agent?: string; agentUser?: string } = {},
  ): Promise<any> {
    return this.request('GET', `/get-company-activity?domain=${encodeURIComponent(input.domain)}`, undefined, opts.agent, opts.agentUser);
  }

  // ─── contacts (dashboard utility — not agent-facing) ──────────────────────

  async getContact(id: string): Promise<any> {
    return this.request('GET', `/contacts/${id}`);
  }

  async searchContacts(query: string, params?: { limit?: number }): Promise<any> {
    const qs = new URLSearchParams({ q: query });
    if (params?.limit) qs.set('limit', String(params.limit));
    return this.request('GET', `/contacts/search?${qs}`);
  }

  async importContacts(rows: Record<string, unknown>[]): Promise<any> {
    return this.request('POST', '/imports', { rows });
  }

  // ─── keys ─────────────────────────────────────────────────────────────────

  static async createKey(email: string, baseUrl = DEFAULT_BASE_URL): Promise<any> {
    const res = await fetch(`${baseUrl}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json() as any;
    if (!res.ok) throw new NondualError(res.status, json?.error ?? 'unknown_error', json?.message ?? `HTTP ${res.status}`);
    return json;
  }
}
