import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService, errorMessage } from '../core/api.service';
import { KitchenOrder, OrderStatus } from '../core/models';
import { NEXT_ACTION, utc } from '../core/order-status';

const COLUMNS: { status: OrderStatus; title: string }[] = [
  { status: 'Received', title: 'Received' },
  { status: 'Preparing', title: 'Preparing' },
  { status: 'Ready', title: 'Ready' },
];

@Component({
  selector: 'app-kitchen-page',
  imports: [DatePipe],
  template: `
    <div class="flex items-end justify-between py-8">
      <h1 class="display text-4xl">Kitchen</h1>
      <p class="text-sm text-ink-soft">Refreshes every 5 seconds</p>
    </div>
    @if (actionError() || loadError()) { <p class="mb-4 font-semibold text-ketchup" role="alert">{{ actionError() || loadError() }}</p> }
    <div class="grid gap-5 md:grid-cols-3">
      @for (col of columns; track col.status) {
        <section [attr.aria-label]="col.title">
          <h2 class="mb-3 font-bold">{{ col.title }} <span class="text-ink-soft">({{ byStatus()[col.status].length }})</span></h2>
          <ul class="space-y-4">
            @for (k of byStatus()[col.status]; track k.order.id) {
              <li class="ticket px-4 pt-4">
                <div class="flex items-baseline justify-between">
                  <p class="display text-xl">#{{ k.order.id }}</p>
                  <p class="text-xs text-ink-soft">{{ date(k.order.createdAt) | date: 'h:mm a' }}</p>
                </div>
                <p class="text-sm font-semibold" [class]="k.order.fulfillmentType === 'Delivery' ? 'text-ketchup' : 'text-pickle'">{{ k.order.fulfillmentType }} for {{ k.order.customerName }}</p>
                <ul class="ticket-rule mt-3 space-y-1 py-3 text-sm font-semibold">
                  @for (l of k.items; track l.name) { <li>{{ l.quantity }} × {{ l.name }}</li> }
                </ul>
                @if (action(k.order.status); as a) {
                  <button type="button" class="btn-primary mb-3 w-full" [disabled]="busyId() === k.order.id" (click)="advance(k, a.next)">{{ a.label }}</button>
                }
              </li>
            } @empty {
              <li class="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-ink-soft">No orders here.</li>
            }
          </ul>
        </section>
      }
    </div>
  `,
})
export class KitchenPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columns = COLUMNS;
  protected readonly orders = signal<KitchenOrder[]>([]);
  protected readonly loadError = signal('');
  protected readonly actionError = signal('');
  protected readonly busyId = signal<number | null>(null);
  protected readonly date = utc;
  protected readonly action = (s: OrderStatus) => NEXT_ACTION[s];
  protected readonly byStatus = computed(() => {
    const map: Record<string, KitchenOrder[]> = { Received: [], Preparing: [], Ready: [] };
    for (const o of this.orders()) map[o.order.status]?.push(o);
    return map as Record<OrderStatus, KitchenOrder[]>;
  });

  ngOnInit() {
    this.load();
    const timer = setInterval(() => this.load(), 5000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  load() {
    this.api.kitchenOrders().subscribe({
      next: (o) => { this.orders.set(o); this.loadError.set(''); },
      error: (e) => this.loadError.set(errorMessage(e)),
    });
  }

  advance(k: KitchenOrder, next: OrderStatus) {
    this.busyId.set(k.order.id);
    this.actionError.set('');
    this.api.setStatus(k.order.id, next).subscribe({
      next: () => { this.busyId.set(null); this.load(); },
      error: (e) => { this.busyId.set(null); this.actionError.set(errorMessage(e)); this.load(); },
    });
  }
}
