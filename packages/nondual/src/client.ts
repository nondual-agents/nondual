/**
 * Nondual SDK client.
 * Your agents' system of record for every contact, conversation and next step.
 */

const DEFAULT_BASE_URL = 'https://api.nondual.cloud/v1';

export interface NondualOptions {
  apiKey?: string;
  baseUrl?: string;
  agent?: string;
  agentUser?: string;
}

export interface ResolveInput {
  email?: string;
  linkedin_url?: string;
  phone?: string;
  handle?: string;
}

export interface RecordInput {
  contact: string;           // email or linkedin_url
  channel: string;           // email | linkedin | slack | call | meeting | sms | other
  direction: 'outbound' | 'inbound';
  occurred_at?: string;      // ISO 8601; defaults to now
  summary: string;
  details?: string;          // full content — email body, transcript, notes
  agent?: string;
  agent_user?: string;
}

export interface FollowupInput {
  contact: string;           // email or linkedin_url
  action: string;
  due?: string;              // ISO 8601
  owner?: string;
}

export interface FollowupPatch {
  status?: 'open' | 'done';
  action?: string;
  due?: string;
  owner?: string;
}

// ─── Low-level fetch wrapper ──────────────────────────────────────────────────

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

  private async request<T>(method: string, path: string, body?: unknown, agent?: string, agentUser?: string): Promise<T> {
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

  // ─── contacts.resolve ──────────────────────────────────────────────────────
  async resolve(input: ResolveInput, opts: { agent?: string; agentUser?: string } = {}): Promise<any> {
    return this.request('POST', '/resolve', input, opts.agent, opts.agentUser);
  }

  // ─── contacts.context ─────────────────────────────────────────────────────
  async context(input: { contact: string; purpose?: string }, opts: { agent?: string; agentUser?: string } = {}): Promise<any> {
    return this.request('POST', '/context', input, opts.agent, opts.agentUser);
  }

  // ─── interactions.record ──────────────────────────────────────────────────
  async record(input: RecordInput, opts: { agent?: string; agentUser?: string } = {}): Promise<any> {
    return this.request('POST', '/interactions', input, opts.agent, opts.agentUser);
  }

  // ─── followups ────────────────────────────────────────────────────────────
  async createFollowup(input: FollowupInput, opts: { agent?: string; agentUser?: string } = {}): Promise<any> {
    return this.request('POST', '/followups', input, opts.agent, opts.agentUser);
  }

  async listFollowups(params?: { status?: string; contact?: string }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request('GET', `/followups${q ? `?${q}` : ''}`);
  }

  async completeFollowup(id: string, patch: FollowupPatch = {}): Promise<any> {
    return this.request('PATCH', `/followups/${id}`, { status: 'done', ...patch });
  }

  // ─── contacts ─────────────────────────────────────────────────────────────
  async listContacts(params?: { limit?: number; offset?: number }): Promise<any> {
    const q = new URLSearchParams(params as any).toString();
    return this.request('GET', `/contacts${q ? `?${q}` : ''}`);
  }

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
