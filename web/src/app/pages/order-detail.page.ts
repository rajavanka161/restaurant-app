import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { OrderDetail } from '../core/models';
import { FLOW, canCustomerCancel, statusMessage, statusStep, utc } from '../core/order-status';

@Component({
  selector: 'app-order-detail-page',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <a routerLink="/orders" class="mt-6 inline-block text-sm font-semibold underline">All orders</a>
    @if (error() && !detail()) { <p class="mt-6 font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    @if (detail(); as d) {
      <div class="mx-auto mt-4 max-w-xl">
        <div class="ticket px-6 pt-6">
          <div class="flex items-baseline justify-between">
            <h1 class="display text-3xl">Order #{{ d.order.id }}</h1>
            <span class="text-sm text-ink-soft">{{ d.order.fulfillmentType }}</span>
          </div>

          @if (d.order.status === 'Cancelled') {
            <p class="mt-4 rounded-xl bg-line p-3 font-semibold" role="status">{{ message() }}</p>
          } @else {
            <ol class="mt-6 grid grid-cols-4 gap-2" aria-label="Order progress">
              @for (s of flow; track s; let i = $index) {
                <li class="text-center">
                  <div class="h-2 rounded-full" [class]="i <= step() ? 'bg-ketchup' : 'bg-line'"></div>
                  <p class="mt-2 text-xs font-semibold" [class]="i === step() ? 'text-ink' : 'text-ink-soft'" [attr.aria-current]="i === step() ? 'step' : null">{{ s }}</p>
                </li>
              }
            </ol>
            <p class="mt-4 font-semibold" role="status">{{ message() }}</p>
          }

          <ul class="ticket-rule mt-5 divide-y divide-line py-1">
            @for (l of d.items; track l.name) {
              <li class="flex justify-between gap-3 py-2 text-sm"><span>{{ l.quantity }} × {{ l.name }}</span><span>{{ l.lineTotal | currency }}</span></li>
            }
          </ul>
          <dl class="ticket-rule space-y-1 py-3 text-sm">
            <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ d.order.subtotal | currency }}</dd></div>
            @if (d.order.discount > 0) { <div class="flex justify-between text-pickle"><dt>Promo {{ d.order.promoCode }}</dt><dd>−{{ d.order.discount | currency }}</dd></div> }
            <div class="flex justify-between"><dt>Tax</dt><dd>{{ d.order.tax | currency }}</dd></div>
            @if (d.order.deliveryFee > 0) { <div class="flex justify-between"><dt>Delivery</dt><dd>{{ d.order.deliveryFee | currency }}</dd></div> }
            <div class="flex items-baseline justify-between pt-2"><dt class="font-bold">Total</dt><dd class="display text-xl">{{ d.order.total | currency }}</dd></div>
          </dl>
          @if (d.order.paymentStatus === 'Refunded') {
            <p class="mb-3 text-sm font-semibold text-pickle">Refunded {{ d.order.total | currency }} to your card.</p>
          }
          @if (d.order.deliveryAddress) { <p class="mb-3 text-sm text-ink-soft">Delivering to {{ d.order.deliveryAddress }}</p> }

          <ul class="ticket-rule space-y-1 py-3 text-xs text-ink-soft">
            @for (h of d.history; track $index) { <li>{{ h.status }} at {{ date(h.changedAt) | date: 'h:mm a' }}</li> }
          </ul>

          <button type="button" class="btn-primary mb-4 w-full" [disabled]="busy()" (click)="reorder()">Order again</button>
          @if (notice()) { <p class="mb-3 text-sm font-semibold text-pickle" role="status">{{ notice() }}</p> }
          @if (canCancel()) {
            <button type="button" class="btn-ghost mb-4 w-full" [disabled]="busy()" (click)="cancel()">Cancel order and refund</button>
          }
          @if (error()) { <p class="mb-3 text-sm font-semibold text-ketchup" role="alert">{{ error() }}</p> }
        </div>
      </div>
    }
  `,
})
export class OrderDetailPage implements OnInit {
  readonly id = input.required<string>();
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cart = inject(CartService);

  protected readonly detail = signal<OrderDetail | null>(null);
  protected readonly error = signal('');
  protected readonly busy = signal(false);
  protected readonly notice = signal('');
  protected readonly flow = FLOW;
  protected readonly date = utc;
  protected readonly step = computed(() => statusStep(this.detail()!.order.status));
  protected readonly message = computed(() => statusMessage(this.detail()!.order.status, this.detail()!.order.fulfillmentType));
  protected readonly canCancel = computed(() => canCustomerCancel(this.detail()!.order.status));

  ngOnInit() {
    this.load();
    const timer = setInterval(() => {
      const s = this.detail()?.order.status;
      if (s !== 'Completed' && s !== 'Cancelled') this.load();
    }, 5000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private load() {
    this.api.order(+this.id()).subscribe({
      next: (d) => { this.detail.set(d); this.error.set(''); },
      error: (e) => this.error.set(errorMessage(e, 'Order not found.')),
    });
  }

  reorder() {
    this.busy.set(true);
    this.notice.set('');
    this.error.set('');
    this.cart.reorder(+this.id()).subscribe({
      next: (r) => {
        this.busy.set(false);
        if (r.available.length === 0) {
          this.error.set('None of the items in this order are available right now.');
          return;
        }
        this.cart.refreshQuote();
        this.cart.open.set(true);
        if (r.unavailable.length > 0) this.notice.set(`Not added, no longer available: ${r.unavailable.join(', ')}.`);
      },
      error: (e) => { this.busy.set(false); this.error.set(errorMessage(e)); },
    });
  }

  cancel() {
    this.busy.set(true);
    this.api.cancelOrder(+this.id()).subscribe({
      next: () => { this.busy.set(false); this.load(); },
      error: (e) => { this.busy.set(false); this.error.set(errorMessage(e)); this.load(); },
    });
  }
}
