import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, errorMessage } from '../../core/api.service';
import { DailySalesReport } from '../../core/models';

@Component({
  selector: 'app-report-page',
  imports: [CurrencyPipe, FormsModule],
  template: `
    <div class="mb-5 flex items-end gap-3">
      <div>
        <label class="label" for="date">Date (UTC)</label>
        <input id="date" type="date" class="field !w-auto" [ngModel]="date()" (ngModelChange)="setDate($event)">
      </div>
    </div>
    @if (error()) { <p class="font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    @if (report(); as r) {
      <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
        @for (s of stats(); track s.label) {
          <div class="rounded-2xl border border-line bg-white p-4">
            <dt class="text-sm text-ink-soft">{{ s.label }}</dt>
            <dd class="display mt-1 text-2xl">{{ s.money ? (s.value | currency) : s.value }}</dd>
          </div>
        }
      </dl>
      <div class="mt-6 grid gap-6 md:grid-cols-2">
        <section class="rounded-2xl border border-line bg-white p-4">
          <h2 class="mb-3 font-bold">Best sellers</h2>
          @if (r.topItems.length === 0) { <p class="text-sm text-ink-soft">No orders on this date.</p> }
          <ol class="space-y-2">
            @for (t of r.topItems; track t.name) {
              <li class="flex justify-between gap-3 text-sm"><span>{{ t.name }}</span><span class="text-ink-soft">{{ t.quantity }} sold · {{ t.revenue | currency }}</span></li>
            }
          </ol>
        </section>
        <section class="rounded-2xl border border-line bg-white p-4">
          <h2 class="mb-3 font-bold">Sales by hour (UTC)</h2>
          @if (r.hourly.length === 0) { <p class="text-sm text-ink-soft">No orders on this date.</p> }
          <ul class="space-y-1.5">
            @for (h of r.hourly; track h.hour) {
              <li class="flex items-center gap-3 text-sm">
                <span class="w-12 text-ink-soft">{{ h.hour }}:00</span>
                <span class="h-3 rounded-full bg-ketchup" [style.width.%]="barWidth(h.sales)"></span>
                <span>{{ h.sales | currency }} ({{ h.orders }})</span>
              </li>
            }
          </ul>
        </section>
      </div>
    }
  `,
})
export class ReportPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly date = signal(new Date().toISOString().slice(0, 10));
  protected readonly report = signal<DailySalesReport | null>(null);
  protected readonly error = signal('');
  private readonly maxSales = computed(() => Math.max(1, ...(this.report()?.hourly.map((h) => h.sales) ?? [1])));
  protected readonly stats = computed(() => {
    const s = this.report()?.summary;
    if (!s) return [];
    return [
      { label: 'Net sales', value: s.netSales, money: true },
      { label: 'Orders', value: s.orderCount, money: false },
      { label: 'Gross sales', value: s.grossSales, money: true },
      { label: 'Refunded', value: s.refundedAmount, money: true },
      { label: 'Discounts given', value: s.discountsGiven, money: true },
      { label: 'Cancelled orders', value: s.cancelledCount, money: false },
    ];
  });

  ngOnInit() { this.load(); }

  setDate(d: string) { this.date.set(d); this.load(); }

  barWidth(sales: number) { return Math.max(3, (sales / this.maxSales()) * 45); }

  private load() {
    this.api.dailySales(this.date()).subscribe({
      next: (r) => { this.report.set(r); this.error.set(''); },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
