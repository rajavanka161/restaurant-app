import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService, errorMessage } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { MenuCategory, MenuItem } from '../core/models';

@Component({
  selector: 'app-menu-page',
  imports: [CurrencyPipe],
  template: `
    <section class="py-8 sm:py-12">
      <h1 class="display max-w-2xl text-4xl sm:text-6xl">Smashed to order, for pickup or delivery.</h1>
      <p class="mt-3 max-w-xl text-ink-soft">Build your cart, pay online and follow your order from the grill to the counter.</p>
    </section>

    @if (error()) {
      <p class="rounded-xl border border-ketchup/40 bg-ketchup/10 p-4" role="alert">{{ error() }}</p>
    }

    @if (loading()) {
      <p class="py-12 text-ink-soft">Loading the menu…</p>
    }

    @if (categories().length > 0) {
      <nav class="sticky top-[57px] z-20 -mx-4 flex gap-2 overflow-x-auto bg-page/95 px-4 py-3 backdrop-blur" aria-label="Menu categories">
        <button type="button" class="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold"
          [class]="selected() === null ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-mustard/40'"
          (click)="selected.set(null)">All</button>
        @for (c of categories(); track c.id) {
          <button type="button" class="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold"
            [class]="selected() === c.id ? 'border-ink bg-ink text-white' : 'border-line bg-white hover:bg-mustard/40'"
            (click)="selected.set(c.id)">{{ c.name }}</button>
        }
      </nav>

      @for (c of visible(); track c.id) {
        <section class="mt-6" [attr.aria-labelledby]="'cat-' + c.id">
          <h2 class="display mb-4 text-2xl" [id]="'cat-' + c.id">{{ c.name }}</h2>
          <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (item of c.items; track item.id) {
              <li class="flex flex-col rounded-2xl border border-line bg-white p-4">
                <div class="mb-3 grid h-28 place-items-center rounded-xl bg-mustard/40 text-6xl" aria-hidden="true">{{ item.emoji }}</div>
                <h3 class="text-lg font-bold">{{ item.name }}</h3>
                <p class="mt-1 flex-1 text-sm text-ink-soft">{{ item.description }}</p>
                @if (item.calories) { <p class="mt-2 text-xs text-ink-soft">{{ item.calories }} kcal</p> }
                <div class="mt-3 flex items-center justify-between">
                  <span class="display text-xl">{{ item.price | currency }}</span>
                  @if (cart.quantityOf(item.id) === 0) {
                    <button type="button" class="btn-primary !py-2" (click)="add(item)">Add</button>
                  } @else {
                    <div class="flex items-center gap-2">
                      <button type="button" class="grid h-9 w-9 place-items-center rounded-full border border-line font-bold hover:bg-mustard/40" (click)="cart.setQuantity(item, cart.quantityOf(item.id) - 1)" [attr.aria-label]="'Remove one ' + item.name">−</button>
                      <span class="w-5 text-center font-bold" aria-live="polite">{{ cart.quantityOf(item.id) }}</span>
                      <button type="button" class="grid h-9 w-9 place-items-center rounded-full bg-ink font-bold text-white hover:bg-black" (click)="cart.add(item)" [attr.aria-label]="'Add one ' + item.name">+</button>
                    </div>
                  }
                </div>
              </li>
            }
          </ul>
        </section>
      }
    }
  `,
})
export class MenuPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly cart = inject(CartService);

  protected readonly categories = signal<MenuCategory[]>([]);
  protected readonly selected = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly visible = computed(() => {
    const s = this.selected();
    return s === null ? this.categories() : this.categories().filter((c) => c.id === s);
  });

  ngOnInit() {
    this.api.menu().subscribe({
      next: (m) => { this.categories.set(m); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e, 'The menu could not be loaded.')); this.loading.set(false); },
    });
  }

  add(item: MenuItem) { this.cart.add(item); }
}
