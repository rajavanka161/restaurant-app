import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, errorMessage } from '../../core/api.service';
import { OrderSummary } from '../../core/models';
import { utc } from '../../core/order-status';
import { StatusBadge } from '../../shared/status-badge';

@Component({
  selector: 'app-admin-orders-page',
  imports: [CurrencyPipe, DatePipe, StatusBadge],
  template: `
    @if (error()) { <p class="mb-3 font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    <div class="overflow-x-auto rounded-2xl border border-line bg-white">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-line text-ink-soft">
          <tr><th class="p-3">Order</th><th class="p-3">Customer</th><th class="p-3">Placed</th><th class="p-3">Status</th><th class="p-3">Payment</th><th class="p-3 text-right">Total</th><th class="p-3"><span class="sr-only">Actions</span></th></tr>
        </thead>
        <tbody>
          @for (o of orders(); track o.id) {
            <tr class="border-b border-line last:border-0">
              <td class="p-3 font-bold">#{{ o.id }}</td>
              <td class="p-3">{{ o.customerName }}</td>
              <td class="p-3">{{ date(o.createdAt) | date: 'MMM d, h:mm a' }}</td>
              <td class="p-3"><app-status-badge [status]="o.status" /></td>
              <td class="p-3">{{ o.paymentStatus }}</td>
              <td class="p-3 text-right">{{ o.total | currency }}</td>
              <td class="space-x-2 p-3 text-right whitespace-nowrap">
                @if (o.status === 'Received' || o.status === 'Preparing') {
                  <button type="button" class="btn-ghost !px-3 !py-1" (click)="cancel(o)">Cancel</button>
                }
                @if (o.paymentStatus === 'Paid' && o.status !== 'Cancelled') {
                  <button type="button" class="btn-ghost !px-3 !py-1" (click)="refund(o)">Refund</button>
                }
              </td>
            </tr>
          } @empty {
            <tr><td class="p-6 text-center text-ink-soft" colspan="7">No orders yet.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminOrdersPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly orders = signal<OrderSummary[]>([]);
  protected readonly error = signal('');
  protected readonly date = utc;

  ngOnInit() { this.load(); }

  load() {
    this.api.recentOrders().subscribe({ next: (o) => this.orders.set(o), error: (e) => this.error.set(errorMessage(e)) });
  }

  refund(o: OrderSummary) {
    if (!confirm(`Refund ${o.total.toFixed(2)} for order #${o.id}?`)) return;
    this.api.refundOrder(o.id).subscribe({ next: () => { this.error.set(''); this.load(); }, error: (e) => this.error.set(errorMessage(e)) });
  }

  cancel(o: OrderSummary) {
    if (!confirm(`Cancel order #${o.id} and refund the customer?`)) return;
    this.api.cancelOrder(o.id).subscribe({ next: () => { this.error.set(''); this.load(); }, error: (e) => this.error.set(errorMessage(e)) });
  }
}
