import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, errorMessage } from '../../core/api.service';
import { SalesTrendReport } from '../../core/models';

export function rangeEndingToday(days: number, now = new Date()): { from: string; to: string } {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { from: iso(end - (days - 1) * 86_400_000), to: iso(end) };
}

export function changeLabel(pct: number | null): string {
  if (pct === null) return 'No sales in the previous period';
  if (pct === 0) return 'Same as the previous period';
  return `${pct > 0 ? '+' : '−'}${Math.abs(pct)}% vs previous period`;
}

@Component({
  selector: 'app-report-trends-page',
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="mb-5 flex flex-wrap items-end gap-3">
      <div>
        <label class="label" for="from">From (UTC)</label>
        <input id="from" type="date" class="field !w-auto" [ngModel]="from()" (ngModelChange)="setRange($event, to())">
      </div>
      <div>
        <label class="label" for="to">To (UTC)</label>
        <input id="to" type="date" class="field !w-auto" [ngModel]="to()" (ngModelChange)="setRange(from(), $event)">
      </div>
      <button type="button" class="btn-ghost" (click)="preset(7)">Last 7 days</button>
      <button type="button" class="btn-ghost" (click)="preset(30)">Last 30 days</button>
    </div>
    @if (error()) { <p class="font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    @if (report(); as r) {
      <dl class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="rounded-2xl border border-line bg-white p-4">
          <dt class="text-sm text-ink-soft">Net sales</dt>
          <dd class="display mt-1 text-2xl">{{ r.current.netSales | currency }}</dd>
          <dd class="mt-1 text-xs text-ink-soft">{{ label(r.netSalesChangePct) }}</dd>
        </div>
        <div class="rounded-2xl border border-line bg-white p-4">
          <dt class="text-sm text-ink-soft">Orders</dt>
          <dd class="display mt-1 text-2xl">{{ r.current.orderCount }}</dd>
          <dd class="mt-1 text-xs text-ink-soft">{{ label(r.orderCountChangePct) }}</dd>
        </div>
        <div class="rounded-2xl border border-line bg-white p-4">
          <dt class="text-sm text-ink-soft">Discounts given</dt>
          <dd class="display mt-1 text-2xl">{{ r.current.discountsGiven | currency }}</dd>
        </div>
        <div class="rounded-2xl border border-line bg-white p-4">
          <dt class="text-sm text-ink-soft">Refunded</dt>
          <dd class="display mt-1 text-2xl">{{ r.current.refundedAmount | currency }}</dd>
        </div>
      </dl>
      <div class="mt-6 grid gap-6 md:grid-cols-2">
        <section class="rounded-2xl border border-line bg-white p-4">
          <h2 class="mb-3 font-bold">Net sales by day</h2>
          <ul class="space-y-1.5">
            @for (d of r.daily; track d.salesDate) {
              <li class="flex items-center gap-3 text-sm">
                <span class="w-14 text-ink-soft">{{ d.salesDate | date: 'MMM d' }}</span>
                <span class="h-3 rounded-full bg-ketchup" [style.width.%]="barWidth(d.netSales)"></span>
                <span>{{ d.netSales | currency }} ({{ d.orders }})</span>
              </li>
            }
          </ul>
        </section>
        <section class="rounded-2xl border border-line bg-white p-4">
          <h2 class="mb-1 font-bold">Kitchen prep time by hour (UTC)</h2>
          <p class="mb-3 text-xs text-ink-soft">Average minutes from Received to Ready.</p>
          @if (r.prepTimes.length === 0) { <p class="text-sm text-ink-soft">No orders reached Ready in this range.</p> }
          <ul class="space-y-1.5">
            @for (p of r.prepTimes; track p.hour) {
              <li class="flex items-center gap-3 text-sm">
                <span class="w-12 text-ink-soft">{{ p.hour }}:00</span>
                <span class="h-3 rounded-full bg-pickle" [style.width.%]="prepWidth(p.avgMinutes)"></span>
                <span>{{ p.avgMinutes }} min ({{ p.orders }})</span>
              </li>
            }
          </ul>
        </section>
      </div>
    }
  `,
})
export class ReportTrendsPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly initial = rangeEndingToday(7);
  protected readonly from = signal(this.initial.from);
  protected readonly to = signal(this.initial.to);
  protected readonly report = signal<SalesTrendReport | null>(null);
  protected readonly error = signal('');
  protected readonly label = changeLabel;
  private readonly maxSales = computed(() => Math.max(1, ...(this.report()?.daily.map((d) => d.netSales) ?? [1])));
  private readonly maxPrep = computed(() => Math.max(1, ...(this.report()?.prepTimes.map((p) => p.avgMinutes) ?? [1])));

  ngOnInit() { this.load(); }

  preset(days: number) {
    const r = rangeEndingToday(days);
    this.setRange(r.from, r.to);
  }

  setRange(from: string, to: string) {
    this.from.set(from);
    this.to.set(to);
    if (from && to) this.load();
  }

  barWidth(sales: number) { return Math.max(3, (sales / this.maxSales()) * 40); }
  prepWidth(minutes: number) { return Math.max(3, (minutes / this.maxPrep()) * 40); }

  private load() {
    this.api.salesTrends(this.from(), this.to()).subscribe({
      next: (r) => { this.report.set(r); this.error.set(''); },
      error: (e) => { this.report.set(null); this.error.set(errorMessage(e)); },
    });
  }
}
