import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { MenuItem } from './models';

const item = (id: number, price: number): MenuItem => ({
  id, categoryId: 1, category: 'Burgers', name: `Item ${id}`, description: '', price, emoji: '🍔', calories: null, isAvailable: true,
});

describe('CartService', () => {
  let cart: CartService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    cart = TestBed.inject(CartService);
    http = TestBed.inject(HttpTestingController);
  });

  it('adds items and totals count and estimate', () => {
    cart.add(item(1, 8.99));
    cart.add(item(1, 8.99));
    cart.add(item(2, 3.99));
    expect(cart.count()).toBe(3);
    expect(cart.estimate()).toBe(21.97);
    expect(cart.quantityOf(1)).toBe(2);
  });

  it('removes a line when quantity reaches zero and caps at 50', () => {
    const a = item(1, 5);
    cart.setQuantity(a, 2);
    cart.setQuantity(a, 0);
    expect(cart.isEmpty()).toBe(true);
    cart.setQuantity(a, 500);
    expect(cart.quantityOf(1)).toBe(50);
  });

  it('persists to storage and clears everything', () => {
    cart.add(item(1, 5));
    expect(JSON.parse(localStorage.getItem('smashline.cart')!)).toHaveLength(1);
    cart.promoCode.set('X');
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.promoCode()).toBe('');
  });

  it('sends cart lines, fulfillment and promo when quoting', () => {
    cart.add(item(1, 5));
    cart.fulfillment.set('Delivery');
    cart.promoCode.set(' WELCOME10 ');
    cart.refreshQuote();
    const req = http.expectOne((r) => r.url.endsWith('/cart/quote'));
    expect(req.request.body).toEqual({ items: [{ menuItemId: 1, quantity: 1 }], fulfillmentType: 'Delivery', promoCode: 'WELCOME10' });
    req.flush({ subtotal: 5, discount: 0.5, tax: 0.36, deliveryFee: 3.99, total: 8.85, promoValid: true });
    expect(cart.quote()?.total).toBe(8.85);
    expect(cart.quoting()).toBe(false);
  });

  it('ignores a stale quote response that arrives after a newer request', () => {
    cart.add(item(1, 5));
    cart.refreshQuote();
    cart.fulfillment.set('Delivery');
    cart.refreshQuote();
    const [first, second] = http.match((r) => r.url.endsWith('/cart/quote'));
    second.flush({ subtotal: 5, discount: 0, tax: 0.4, deliveryFee: 3.99, total: 9.39, promoValid: true });
    first.flush({ subtotal: 5, discount: 0, tax: 0.4, deliveryFee: 0, total: 5.4, promoValid: true });
    expect(cart.quote()?.total).toBe(9.39);
  });

  it('skips the network call for an empty cart', () => {
    cart.refreshQuote();
    http.expectNone((r) => r.url.endsWith('/cart/quote'));
    expect(cart.quote()).toBeNull();
  });
});
