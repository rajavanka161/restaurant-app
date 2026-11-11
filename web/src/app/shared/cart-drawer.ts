import { CurrencyPipe } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../core/cart.service';

@Component({
  selector: 'app-cart-drawer',
  imports: [CurrencyPipe],
  template: `
    @if (cart.open()) {
      <div class="fixed inset-0 z-40 bg-ink/40" (click)="close()" aria-hidden="true"></div>
      <aside class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col p-3" role="dialog" aria-modal="true" aria-label="Your order">
        <div class="ticket flex max-h-full flex-col overflow-hidden px-5 pt-5">
          <div class="flex items-center justify-between">
            <h2 class="display text-2xl">Your order</h2>
            <button type="button" class="rounded-full px-3 py-1 text-sm font-semibold hover:bg-mustard/40" (click)="close()">Close</button>
          </div>
          @if (cart.isEmpty()) {
            <p class="py-12 text-center text-ink-soft">Nothing here yet. Add a burger from the menu.</p>
          } @else {
            <ul class="ticket-rule mt-4 flex-1 divide-y divide-line overflow-y-auto">
              @for (e of cart.lines(); track e.item.id) {
                <li class="flex items-center gap-3 py-3">
                  <span class="text-2xl" aria-hidden="true">{{ e.item.emoji }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold">{{ e.item.name }}</p>
                    <p class="text-sm text-ink-soft">{{ e.item.price | currency }} each</p>
                  </div>
                  <div class="flex items-center gap-1">
                    <button type="button" class="grid h-8 w-8 place-items-center rounded-full border border-line font-bold hover:bg-mustard/40" (click)="cart.setQuantity(e.item, e.quantity - 1)" [attr.aria-label]="'Remove one ' + e.item.name">−</button>
                    <span class="w-6 text-center font-semibold">{{ e.quantity }}</span>
                    <button type="button" class="grid h-8 w-8 place-items-center rounded-full border border-line font-bold hover:bg-mustard/40" (click)="cart.setQuantity(e.item, e.quantity + 1)" [attr.aria-label]="'Add one ' + e.item.name">+</button>
                  </div>
                  <span class="w-16 text-right font-semibold">{{ e.item.price * e.quantity | currency }}</span>
                </li>
              }
            </ul>
            <div class="ticket-rule mt-2 flex items-baseline justify-between py-4">
              <span class="font-semibold">Subtotal</span>
              <span class="display text-xl">{{ cart.estimate() | currency }}</span>
            </div>
            <p class="pb-3 text-xs text-ink-soft">Tax, delivery and promo codes are added at checkout.</p>
            <button type="button" class="btn-primary mb-2 w-full" (click)="checkout()">Go to checkout</button>
            <button type="button" class="mb-2 w-full text-sm font-semibold text-ink-soft hover:text-ketchup" (click)="cart.clear()">Empty cart</button>
          }
        </div>
      </aside>
    }
  `,
})
export class CartDrawer {
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  @HostListener('document:keydown.escape')
  close() { this.cart.open.set(false); }

  checkout() {
    this.close();
    this.router.navigate(['/checkout']);
  }
}
