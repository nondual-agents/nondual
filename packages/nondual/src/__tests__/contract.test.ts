/**
 * SDK contract tests.
 *
 * Tests that every documented public method exists with the right name.
 * Catches renames (nd.followup → nd.createFollowup) at test time, not user-report time.
 * No network calls — just verifying the public interface shape.
 */
import { describe, it, expect } from 'vitest';
import { Nondual } from '../client.js';

describe('CONTRACT: SDK public method names', () => {
  const nd = new Nondual({ apiKey: 'nd_test' });

  it('nd.resolve exists', () => {
    expect(typeof nd.resolve).toBe('function');
  });

  it('nd.context exists', () => {
    expect(typeof nd.context).toBe('function');
  });

  it('nd.record exists', () => {
    expect(typeof nd.record).toBe('function');
  });

  it('nd.followup exists (documented short alias)', () => {
    // This is the alias shown in the docs. If it goes missing, this test fails.
    expect(typeof nd.followup).toBe('function');
  });

  it('nd.createFollowup exists (full method name)', () => {
    expect(typeof nd.createFollowup).toBe('function');
  });
});

describe('CONTRACT: SDK RecordInput accepts documented fields', () => {
  it('record() accepts contact field', () => {
    // TypeScript type check — if contact field is removed from RecordInput this won't compile
    const input: Parameters<Nondual['record']>[0] = {
      contact: 'jane@acme.com',
      channel: 'email',
      direction: 'outbound',
      summary: 'Sent intro',
    };
    expect(input.contact).toBe('jane@acme.com');
  });

  it('record() accepts optional details field', () => {
    const input: Parameters<Nondual['record']>[0] = {
      contact: 'jane@acme.com',
      channel: 'email',
      direction: 'outbound',
      summary: 'Sent intro',
      details: 'Full email body here.',
    };
    expect(input.details).toBe('Full email body here.');
  });
});

describe('CONTRACT: SDK FollowupInput accepts documented fields', () => {
  it('createFollowup() accepts contact field', () => {
    const input: Parameters<Nondual['createFollowup']>[0] = {
      contact: 'jane@acme.com',
      action: 'Follow up with proposal',
      due: '2026-08-01',
    };
    expect(input.contact).toBe('jane@acme.com');
  });
});
