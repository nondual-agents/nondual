/**
 * SDK contract tests — v0.3.0
 *
 * Tests that every documented public method exists with the right name and signature.
 * Catches renames at test time, not user-report time.
 * No network calls — just verifying the public interface shape.
 */
import { describe, it, expect } from 'vitest';
import { Nondual } from '../client.js';

describe('CONTRACT: V2 SDK public method names', () => {
  const nd = new Nondual({ apiKey: 'nd_test' });

  it('nd.getContactInfo exists', () => {
    expect(typeof nd.getContactInfo).toBe('function');
  });

  it('nd.recordContactInteraction exists', () => {
    expect(typeof nd.recordContactInteraction).toBe('function');
  });

  it('nd.listOpenFollowups exists', () => {
    expect(typeof nd.listOpenFollowups).toBe('function');
  });

  it('nd.getCompanyActivity exists', () => {
    expect(typeof nd.getCompanyActivity).toBe('function');
  });
});

describe('CONTRACT: V2 input types accept documented fields', () => {
  it('getContactInfo() accepts contact and enrich fields', () => {
    const input: Parameters<Nondual['getContactInfo']>[0] = {
      contact: 'jane@acme.com',
      enrich: true,
    };
    expect(input.contact).toBe('jane@acme.com');
    expect(input.enrich).toBe(true);
  });

  it('recordContactInteraction() accepts all documented fields', () => {
    const input: Parameters<Nondual['recordContactInteraction']>[0] = {
      contact: 'jane@acme.com',
      channel: 'email',
      direction: 'outbound',
      summary: 'Sent intro',
      details: 'Full email body.',
      followup_action: 'Follow up',
      followup_due: '2026-08-01',
      complete_followups: ['followup_1'],
      do_not_disturb: false,
    };
    expect(input.contact).toBe('jane@acme.com');
    expect(input.followup_action).toBe('Follow up');
    expect(input.do_not_disturb).toBe(false);
  });

  it('recordContactInteraction() accepts complete_followups: "all"', () => {
    const input: Parameters<Nondual['recordContactInteraction']>[0] = {
      contact: 'jane@acme.com',
      channel: 'call',
      direction: 'inbound',
      summary: 'Closed deal',
      complete_followups: 'all',
    };
    expect(input.complete_followups).toBe('all');
  });

  it('listOpenFollowups() accepts due_before, owner, company filters', () => {
    const input: Parameters<Nondual['listOpenFollowups']>[0] = {
      due_before: '2026-08-01',
      owner: 'agent_a',
      company: 'acme.com',
    };
    expect(input?.due_before).toBe('2026-08-01');
    expect(input?.company).toBe('acme.com');
  });

  it('getCompanyActivity() accepts domain field', () => {
    const input: Parameters<Nondual['getCompanyActivity']>[0] = {
      domain: 'acme.com',
    };
    expect(input.domain).toBe('acme.com');
  });
});

describe('CONTRACT: V1 methods are gone', () => {
  const nd = new Nondual({ apiKey: 'nd_test' });

  it('resolve does not exist', () => {
    expect((nd as any).resolve).toBeUndefined();
  });
  it('context does not exist', () => {
    expect((nd as any).context).toBeUndefined();
  });
  it('record does not exist', () => {
    expect((nd as any).record).toBeUndefined();
  });
  it('createFollowup does not exist', () => {
    expect((nd as any).createFollowup).toBeUndefined();
  });
  it('followup does not exist', () => {
    expect((nd as any).followup).toBeUndefined();
  });
});

describe('CONTRACT: Nondual.createKey is a static method', () => {
  it('createKey exists and is a function', () => {
    expect(typeof Nondual.createKey).toBe('function');
  });
});
