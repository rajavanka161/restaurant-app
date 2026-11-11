import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { OrderSummary } from '../core/models';
import { utc } from '../core/order-status';
import { StatusBadge } from '../shared/status-badge';

@Component({
  selector: 'app-orders-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, StatusBadge],
  template: `
    <h1 class="display py-8 text-4xl">My orders</h1>
    @if (error()) { <p class="font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    @if (!loading() && orders().length === 0 && !error()) {
      <p class="text-ink-soft">You have not ordered yet. <a routerLink="/" class="font-semibold underline">Start with the menu</a></p>
    }
    <ul class="space-y-3">
      @for (o of orders(); track o.id) {
        <li>
          <a [routerLink]="['/orders', o.id]" class="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 hover:border-ink">
            <div class="flex-1">
              <p class="font-bold">Order #{{ o.id }}</p>
              <p class="text-sm text-ink-soft">{{ date(o.createdAt) | date: 'MMM d, h:mm a' }} · {{ o.itemCount }} items · {{ o.fulfillmentType }}</p>
            </div>
            <app-status-badge [status]="o.status" />
            <span class="w-20 text-right font-bold">{{ o.total | currency }}</span>
          </a>
        </li>
      }
    </ul>
  `,
})
export class OrdersPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly orders = signal<OrderSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly date = utc;

  ngOnInit() {
    this.api.myOrders().subscribe({
      next: (o) => { this.orders.set(o); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
