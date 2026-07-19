/**
 * SDK contract tests — v0.3.0 four-call interface.
 *
 * These tests verify the documented SDK surface using msw to mock the HTTP layer.
 * They do not hit the real API.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Nondual, NondualError } from '../client.js';

// ─── Minimal fetch mock ───────────────────────────────────────────────────────

type MockRoute = {
  method: string;
  path: string;
  status: number;
  body: any;
};

const routes: MockRoute[] = [];

function mockFetch(url: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const urlObj = new URL(url);
  const path = urlObj.pathname + urlObj.search;

  for (const r of routes) {
    if (r.method === method && path.startsWith(r.path.split('?')[0]!)) {
      const json = JSON.stringify(r.body);
      return Promise.resolve(new Response(json, {
        status: r.status,
        headers: { 'Content-Type': 'application/json' },
      }));
    }
  }
  return Promise.resolve(new Response(JSON.stringify({ error: 'not_found' }), { status: 404 }));
}

beforeAll(() => { (global as any).fetch = mockFetch; });
afterAll(() => { delete (global as any).fetch; });

const client = new Nondual({ apiKey: 'nd_testkey000000000000000000000000000000000', baseUrl: 'https://api.nondual.cloud/v1' });

// ─── getContactInfo ───────────────────────────────────────────────────────────

describe('SDK: getContactInfo', () => {
  it('POST /v1/get-contact-info with contact field', async () => {
    const mockContact = {
      id: 'contact_1', do_not_disturb: false, do_not_disturb_set_at: null,
      name: 'Jane Doe', identifiers: { emails: ['jane@acme.com'], linkedin_url: null, phones: [], handles: [] },
      profile: { role: 'CTO', headline: null, about: null, location: null, country: null, skills: [], profiles: {} },
      company: { id: 'c1', name: 'Acme', domain: 'acme.com' },
      relationship: { summary: 'First contact.', stage: null, last_interaction_at: null },
      next: { action: 'Send intro', due: null, owner: null },
      provenance: {}, created_at: '', updated_at: '',
    };
    routes.push({
      method: 'POST', path: '/v1/get-contact-info', status: 200,
      body: { contact: mockContact, enriched: true, relationship_summary: 'First contact.', recommended_next_action: 'Send intro', recent_interactions: [], open_followups: [] },
    });

    const res = await client.getContactInfo({ contact: 'jane@acme.com' });
    expect(res.contact).toHaveProperty('id');
    expect(res.contact).toHaveProperty('do_not_disturb');
    expect(res).toHaveProperty('enriched');
    expect(res).toHaveProperty('recommended_next_action');
    routes.length = 0;
  });

  it('throws NondualError on 401', async () => {
    routes.push({ method: 'POST', path: '/v1/get-contact-info', status: 401, body: { error: 'unauthorized', message: 'Invalid API key.' } });
    await expect(client.getContactInfo({ contact: 'jane@acme.com' })).rejects.toBeInstanceOf(NondualError);
    routes.length = 0;
  });

  it('NondualError carries status and code', async () => {
    routes.push({ method: 'POST', path: '/v1/get-contact-info', status: 400, body: { error: 'invalid_request', message: 'contact is required.' } });
    try {
      await client.getContactInfo({ contact: '' });
      expect.fail('should throw');
    } catch (err: any) {
      expect(err).toBeInstanceOf(NondualError);
      expect(err.status).toBe(400);
      expect(err.code).toBe('invalid_request');
    }
    routes.length = 0;
  });
});

// ─── recordContactInteraction ─────────────────────────────────────────────────

describe('SDK: recordContactInteraction', () => {
  it('POST /v1/record-contact-interaction returns interaction + followup_created', async () => {
    routes.push({
      method: 'POST', path: '/v1/record-contact-interaction', status: 201,
      body: {
        interaction: { id: 'interaction_1', contact_id: 'contact_1', channel: 'email', direction: 'outbound', summary: 'Sent intro', participants: [], recorded_by: { agent: null, user: null }, source: { platform: null, external_id: null }, occurred_at: '', created_at: '' },
        followup_created: { id: 'followup_1', action: 'Follow up', due: '2026-08-01', owner: null, status: 'open', created_from: 'interaction_1', completed_by_interaction: null, completed_at: null, created_at: '', updated_at: '' },
        followups_completed: [],
        contact_created: false,
      },
    });
    const res = await client.recordContactInteraction({
      contact: 'jane@acme.com',
      channel: 'email',
      direction: 'outbound',
      summary: 'Sent intro',
      followup_action: 'Follow up',
      followup_due: '2026-08-01',
    });
    expect(res.interaction).toHaveProperty('id');
    expect(res.followup_created).not.toBeNull();
    expect(res.followup_created.id).toMatch(/^followup_/);
    expect(res).toHaveProperty('contact_created');
    routes.length = 0;
  });

  it('complete_followups: "all" accepted in input', async () => {
    routes.push({
      method: 'POST', path: '/v1/record-contact-interaction', status: 201,
      body: { interaction: { id: 'interaction_2', contact_id: 'contact_1', channel: 'call', direction: 'inbound', summary: 'Closed deal', participants: [], recorded_by: { agent: null, user: null }, source: { platform: null, external_id: null }, occurred_at: '', created_at: '' }, followup_created: null, followups_completed: ['followup_1'], contact_created: false },
    });
    const res = await client.recordContactInteraction({
      contact: 'jane@acme.com',
      channel: 'call',
      direction: 'inbound',
      summary: 'Closed deal',
      complete_followups: 'all',
    });
    expect(res.followups_completed).toContain('followup_1');
    routes.length = 0;
  });
});

// ─── listOpenFollowups ────────────────────────────────────────────────────────

describe('SDK: listOpenFollowups', () => {
  it('GET /v1/list-open-followups returns followups with contact snippet', async () => {
    routes.push({
      method: 'GET', path: '/v1/list-open-followups', status: 200,
      body: {
        followups: [{
          id: 'followup_1', action: 'Follow up', due: '2026-08-01', owner: null,
          contact: { id: 'contact_1', name: 'Jane Doe', email: 'jane@acme.com', company: 'Acme', do_not_disturb: false },
        }],
      },
    });
    const res = await client.listOpenFollowups();
    expect(Array.isArray(res.followups)).toBe(true);
    expect(res.followups[0]).toHaveProperty('contact');
    expect(res.followups[0].contact).toHaveProperty('do_not_disturb');
    routes.length = 0;
  });

  it('passes due_before and company filters as query params', async () => {
    let capturedUrl = '';
    const origFetch = (global as any).fetch;
    (global as any).fetch = (url: string, init?: RequestInit) => {
      capturedUrl = url;
      return Promise.resolve(new Response(JSON.stringify({ followups: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    };

    await client.listOpenFollowups({ due_before: '2026-08-01', company: 'acme.com' });
    expect(capturedUrl).toContain('due_before=2026-08-01');
    expect(capturedUrl).toContain('company=acme.com');

    (global as any).fetch = origFetch;
  });
});

// ─── getCompanyActivity ───────────────────────────────────────────────────────

describe('SDK: getCompanyActivity', () => {
  it('GET /v1/get-company-activity?domain= returns contacts array', async () => {
    routes.push({
      method: 'GET', path: '/v1/get-company-activity', status: 200,
      body: {
        domain: 'acme.com',
        contacts: [{
          id: 'contact_1', name: 'Jane Doe', do_not_disturb: false, do_not_disturb_set_at: null,
          identifiers: { emails: ['jane@acme.com'], linkedin_url: null, phones: [], handles: [] },
          profile: { role: 'CTO', headline: null, about: null, location: null, country: null, skills: [], profiles: {} },
          company: { id: 'c1', name: 'Acme', domain: 'acme.com' },
          relationship: { summary: 'First contact.', stage: null, last_interaction_at: null },
          next: { action: 'Send intro', due: null, owner: null },
          provenance: {}, created_at: '', updated_at: '',
          interactions: [],
        }],
        total_contacts: 1,
      },
    });
    const res = await client.getCompanyActivity({ domain: 'acme.com' });
    expect(res.domain).toBe('acme.com');
    expect(Array.isArray(res.contacts)).toBe(true);
    expect(res.contacts[0]).toHaveProperty('do_not_disturb');
    routes.length = 0;
  });

  it('passes domain as query param', async () => {
    let capturedUrl = '';
    const origFetch = (global as any).fetch;
    (global as any).fetch = (url: string, init?: RequestInit) => {
      capturedUrl = url;
      return Promise.resolve(new Response(JSON.stringify({ domain: 'acme.com', contacts: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    };

    await client.getCompanyActivity({ domain: 'acme.com' });
    expect(capturedUrl).toContain('domain=acme.com');

    (global as any).fetch = origFetch;
  });
});

// ─── V1 routes must not exist on the client ───────────────────────────────────

describe('SDK: V1 methods are removed', () => {
  it('resolve is not a method', () => {
    expect((client as any).resolve).toBeUndefined();
  });
  it('context is not a method', () => {
    expect((client as any).context).toBeUndefined();
  });
  it('record is not a method', () => {
    expect((client as any).record).toBeUndefined();
  });
  it('createFollowup is not a method', () => {
    expect((client as any).createFollowup).toBeUndefined();
  });
  it('followup is not a method', () => {
    expect((client as any).followup).toBeUndefined();
  });
  it('listFollowups is not a method', () => {
    expect((client as any).listFollowups).toBeUndefined();
  });
  it('completeFollowup is not a method', () => {
    expect((client as any).completeFollowup).toBeUndefined();
  });
  it('listContacts is not a method', () => {
    expect((client as any).listContacts).toBeUndefined();
  });
});

// ─── NondualError ─────────────────────────────────────────────────────────────

describe('NondualError', () => {
  it('is an Error subclass', () => {
    const err = new NondualError(400, 'invalid_request', 'bad');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('NondualError');
    expect(err.status).toBe(400);
    expect(err.code).toBe('invalid_request');
    expect(err.message).toBe('bad');
  });
});
