import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { Fulfillment } from '../core/models';

@Component({
  selector: 'app-checkout-page',
  imports: [FormsModule, CurrencyPipe, RouterLink],
  template: `
    <h1 class="display py-8 text-4xl">Checkout</h1>
    @if (cart.isEmpty()) {
      <p class="text-ink-soft">Your cart is empty. <a routerLink="/" class="font-semibold underline">Back to the menu</a></p>
    } @else {
      <div class="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form class="space-y-6" (ngSubmit)="place()" #f="ngForm">
          <fieldset>
            <legend class="label">How do you want it?</legend>
            <div class="grid grid-cols-2 gap-3">
              @for (t of types; track t) {
                <label class="cursor-pointer rounded-2xl border-2 p-4 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-ink"
                  [class]="cart.fulfillment() === t ? 'border-ink bg-mustard/40' : 'border-line bg-white'">
                  <input type="radio" class="sr-only" name="fulfillment" [value]="t" [ngModel]="cart.fulfillment()" (ngModelChange)="setFulfillment($event)">
                  <span class="block font-bold">{{ t }}</span>
                  <span class="text-sm text-ink-soft">{{ t === 'Pickup' ? 'Collect at the counter' : 'Free over $30, otherwise $3.99' }}</span>
                </label>
              }
            </div>
          </fieldset>

          @if (cart.fulfillment() === 'Delivery') {
            <div>
              <label class="label" for="address">Delivery address</label>
              <input id="address" name="address" class="field" required [(ngModel)]="address" autocomplete="street-address">
            </div>
          }
          <div>
            <label class="label" for="phone">Phone (so we can reach you about this order)</label>
            <input id="phone" name="phone" type="tel" class="field" [(ngModel)]="phone" autocomplete="tel">
          </div>

          <div>
            <label class="label" for="promo">Promo code</label>
            <div class="flex gap-2">
              <input id="promo" name="promo" class="field uppercase" placeholder="WELCOME10" [ngModel]="cart.promoCode()" (ngModelChange)="cart.promoCode.set($event)">
              <button type="button" class="btn-ghost" (click)="cart.refreshQuote()">Apply</button>
            </div>
            @if (cart.promoCode().trim() && cart.quote() && !cart.quote()!.promoValid) {
              <p class="mt-1 text-sm font-semibold text-ketchup">That code is not valid for this order.</p>
            } @else if (cart.quote() && cart.quote()!.discount > 0) {
              <p class="mt-1 text-sm font-semibold text-pickle">Code applied. You save {{ cart.quote()!.discount | currency }}.</p>
            }
          </div>

          <fieldset class="space-y-3">
            <legend class="label">Payment</legend>
            <input name="cardName" class="field" placeholder="Name on card" required [(ngModel)]="cardName" autocomplete="cc-name" aria-label="Name on card">
            <input name="card" class="field" placeholder="Card number" required inputmode="numeric" [(ngModel)]="card" autocomplete="cc-number" aria-label="Card number">
            <p class="text-xs text-ink-soft">Demo payments only. Use any 16 digits. A number ending in 0000 is declined.</p>
          </fieldset>

          @if (error()) { <p class="font-semibold text-ketchup" role="alert">{{ error() }}</p> }
          <button type="submit" class="btn-primary w-full !py-3.5 text-lg" [disabled]="busy() || f.invalid || !cart.quote() || cart.quoting()">
            {{ busy() ? 'Placing order…' : 'Pay ' + (cart.quote() ? (cart.quote()!.total | currency) : '') }}
          </button>
        </form>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <div class="ticket px-5 pt-5">
            <h2 class="display text-xl">Order summary</h2>
            <ul class="ticket-rule mt-3 space-y-2 py-3 text-sm">
              @for (e of cart.lines(); track e.item.id) {
                <li class="flex justify-between gap-3"><span>{{ e.quantity }} × {{ e.item.name }}</span><span>{{ e.item.price * e.quantity | currency }}</span></li>
              }
            </ul>
            @if (cart.quote(); as q) {
              <dl class="ticket-rule space-y-1 py-3 text-sm">
                <div class="flex justify-between"><dt>Subtotal</dt><dd>{{ q.subtotal | currency }}</dd></div>
                @if (q.discount > 0) { <div class="flex justify-between text-pickle"><dt>Promo</dt><dd>−{{ q.discount | currency }}</dd></div> }
                <div class="flex justify-between"><dt>Tax</dt><dd>{{ q.tax | currency }}</dd></div>
                @if (cart.fulfillment() === 'Delivery') { <div class="flex justify-between"><dt>Delivery</dt><dd>{{ q.deliveryFee === 0 ? 'Free' : (q.deliveryFee | currency) }}</dd></div> }
              </dl>
              <div class="ticket-rule flex items-baseline justify-between py-3">
                <span class="font-bold">Total</span><span class="display text-2xl">{{ q.total | currency }}</span>
              </div>
            } @else {
              <p class="ticket-rule py-4 text-sm text-ink-soft">Calculating your total…</p>
            }
          </div>
        </aside>
      </div>
    }
  `,
})
export class CheckoutPage implements OnInit {
  protected readonly cart = inject(CartService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly types: Fulfillment[] = ['Pickup', 'Delivery'];
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected address = '';
  protected phone = '';
  protected card = '';
  protected cardName = '';

  ngOnInit() { this.cart.refreshQuote(); }

  setFulfillment(t: Fulfillment) {
    this.cart.fulfillment.set(t);
    this.cart.refreshQuote();
  }

  place() {
    this.busy.set(true);
    this.error.set('');
    this.api.placeOrder({
      items: this.cart.toLines(),
      fulfillmentType: this.cart.fulfillment(),
      promoCode: this.cart.promoCode().trim() || null,
      deliveryAddress: this.cart.fulfillment() === 'Delivery' ? this.address : null,
      phone: this.phone || null,
      payment: { cardNumber: this.card, name: this.cardName },
    }).subscribe({
      next: (d) => { this.cart.clear(); this.router.navigate(['/orders', d.order.id]); },
      error: (e) => { this.error.set(errorMessage(e)); this.busy.set(false); this.cart.refreshQuote(); },
    });
  }
}
