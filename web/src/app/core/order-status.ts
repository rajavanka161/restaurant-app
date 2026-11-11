import { OrderStatus } from './models';

export const FLOW: OrderStatus[] = ['Received', 'Preparing', 'Ready', 'Completed'];

export const NEXT_ACTION: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  Received: { next: 'Preparing', label: 'Start preparing' },
  Preparing: { next: 'Ready', label: 'Mark ready' },
  Ready: { next: 'Completed', label: 'Hand off' },
};

export function statusStep(status: OrderStatus): number {
  return FLOW.indexOf(status);
}

export function statusMessage(status: OrderStatus, fulfillment: 'Pickup' | 'Delivery'): string {
  switch (status) {
    case 'Received': return 'We have your order and the kitchen will pick it up shortly.';
    case 'Preparing': return 'Your food is on the grill.';
    case 'Ready': return fulfillment === 'Pickup' ? 'Ready at the counter. Come and get it.' : 'Packed and waiting for the driver.';
    case 'Completed': return fulfillment === 'Pickup' ? 'Picked up. Enjoy.' : 'Delivered. Enjoy.';
    case 'Cancelled': return 'This order was cancelled and the payment refunded.';
  }
}

export function canCustomerCancel(status: OrderStatus): boolean {
  return status === 'Received';
}

export function utc(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : value + 'Z');
}
