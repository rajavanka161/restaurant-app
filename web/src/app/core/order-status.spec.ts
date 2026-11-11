import { NEXT_ACTION, canCustomerCancel, statusMessage, statusStep, utc } from './order-status';

describe('order status helpers', () => {
  it('orders the happy path steps', () => {
    expect(['Received', 'Preparing', 'Ready', 'Completed'].map((s) => statusStep(s as never))).toEqual([0, 1, 2, 3]);
  });

  it('gives kitchen the next action for each open status and none for terminal ones', () => {
    expect(NEXT_ACTION['Received']?.next).toBe('Preparing');
    expect(NEXT_ACTION['Preparing']?.next).toBe('Ready');
    expect(NEXT_ACTION['Ready']?.next).toBe('Completed');
    expect(NEXT_ACTION['Completed']).toBeUndefined();
    expect(NEXT_ACTION['Cancelled']).toBeUndefined();
  });

  it('lets customers cancel only before preparation starts', () => {
    expect(canCustomerCancel('Received')).toBe(true);
    for (const s of ['Preparing', 'Ready', 'Completed', 'Cancelled'] as const) expect(canCustomerCancel(s)).toBe(false);
  });

  it('words the ready message by fulfillment type', () => {
    expect(statusMessage('Ready', 'Pickup')).toContain('counter');
    expect(statusMessage('Ready', 'Delivery')).toContain('driver');
  });

  it('treats API timestamps without a zone as UTC', () => {
    expect(utc('2026-11-11T08:56:11.5526246').toISOString()).toBe('2026-11-11T08:56:11.552Z');
    expect(utc('2026-11-11T08:56:11Z').toISOString()).toBe('2026-11-11T08:56:11.000Z');
  });
});
