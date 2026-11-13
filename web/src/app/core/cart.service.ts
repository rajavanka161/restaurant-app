import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { CartLine, Fulfillment, MenuItem, Quote, ReorderResult } from './models';

const KEY = 'smashline.cart';

export interface CartEntry { item: MenuItem; quantity: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly entries = signal<CartEntry[]>(this.load());

  readonly lines = this.entries.asReadonly();
  readonly count = computed(() => this.entries().reduce((n, e) => n + e.quantity, 0));
  readonly estimate = computed(() => round2(this.entries().reduce((s, e) => s + e.item.price * e.quantity, 0)));
  readonly isEmpty = computed(() => this.entries().length === 0);
  readonly open = signal(false);

  readonly fulfillment = signal<Fulfillment>('Pickup');
  readonly promoCode = signal<string>('');
  readonly quote = signal<Quote | null>(null);
  readonly quoting = signal(false);
  private quoteSeq = 0;

  quantityOf(itemId: number): number {
    return this.entries().find((e) => e.item.id === itemId)?.quantity ?? 0;
  }

  add(item: MenuItem) { this.setQuantity(item, this.quantityOf(item.id) + 1); }

  setQuantity(item: MenuItem, quantity: number) {
    const q = Math.min(Math.max(0, Math.floor(quantity)), 50);
    const rest = this.entries().filter((e) => e.item.id !== item.id);
    this.commit(q === 0 ? rest : [...rest, { item, quantity: q }].sort((a, b) => a.item.id - b.item.id));
  }

  addMany(lines: CartEntry[]) {
    const merged = new Map(this.entries().map((e) => [e.item.id, e]));
    for (const l of lines) {
      const q = Math.min((merged.get(l.item.id)?.quantity ?? 0) + l.quantity, 50);
      merged.set(l.item.id, { item: l.item, quantity: q });
    }
    this.commit([...merged.values()].sort((a, b) => a.item.id - b.item.id));
  }

  reorder(orderId: number): Observable<ReorderResult> {
    return this.api.reorder(orderId).pipe(tap((r) => this.addMany(r.available)));
  }

  clear() {
    this.commit([]);
    this.promoCode.set('');
    this.quote.set(null);
  }

  toLines(): CartLine[] {
    return this.entries().map((e) => ({ menuItemId: e.item.id, quantity: e.quantity }));
  }

  refreshQuote() {
    if (this.isEmpty()) { this.quote.set(null); return; }
    const seq = ++this.quoteSeq;
    this.quoting.set(true);
    this.api.quote(this.toLines(), this.fulfillment(), this.promoCode().trim() || null).subscribe({
      next: (q) => { if (seq === this.quoteSeq) { this.quote.set(q); this.quoting.set(false); } },
      error: () => { if (seq === this.quoteSeq) { this.quote.set(null); this.quoting.set(false); } },
    });
  }

  private commit(next: CartEntry[]) {
    this.entries.set(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  }

  private load(): CartEntry[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CartEntry[]) : [];
    } catch {
      return [];
    }
  }
}

function round2(n: number) { return Math.round(n * 100) / 100; }
