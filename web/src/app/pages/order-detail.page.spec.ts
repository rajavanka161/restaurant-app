import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../core/cart.service';
import { OrderDetail } from '../core/models';
import { OrderDetailPage } from './order-detail.page';

const detail: OrderDetail = {
  order: {
    id: 1001, userId: 1, customerName: 'Casey', fulfillmentType: 'Pickup', status: 'Completed', paymentStatus: 'Paid',
    subtotal: 10, discount: 0, tax: 0.8, deliveryFee: 0, total: 10.8, promoCode: null, deliveryAddress: null, phone: null,
    createdAt: '2026-11-11T08:00:00', updatedAt: '2026-11-11T08:10:00', itemCount: 2,
  },
  items: [{ name: 'Classic Smash', unitPrice: 8.99, quantity: 2, lineTotal: 17.98 }],
  history: [],
};

const menuItem = { id: 1, categoryId: 1, category: 'Burgers', name: 'Classic Smash', description: '', price: 8.99, emoji: '🍔', calories: null, isAvailable: true };

describe('OrderDetailPage reorder', () => {
  let http: HttpTestingController;

  const open = async () => {
    const fixture = TestBed.createComponent(OrderDetailPage);
    fixture.componentRef.setInput('id', '1001');
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/orders/1001')).flush(detail);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  };
  const button = (el: HTMLElement) => [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Order again')) as HTMLButtonElement;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });

  it('fills the cart, opens it and lists items that could not be added', async () => {
    const fixture = await open();
    button(fixture.nativeElement).click();
    http.expectOne((r) => r.url.endsWith('/orders/1001/reorder')).flush({ available: [{ item: menuItem, quantity: 2 }], unavailable: ['Shake'] });
    http.expectOne((r) => r.url.endsWith('/cart/quote')).flush({ subtotal: 17.98, discount: 0, tax: 1.44, deliveryFee: 0, total: 19.42, promoValid: true });
    fixture.detectChanges();
    const cart = TestBed.inject(CartService);
    expect(cart.quantityOf(1)).toBe(2);
    expect(cart.open()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('no longer available: Shake');
    fixture.destroy();
  });

  it('tells the customer when nothing from the order can be reordered', async () => {
    const fixture = await open();
    button(fixture.nativeElement).click();
    http.expectOne((r) => r.url.endsWith('/orders/1001/reorder')).flush({ available: [], unavailable: ['Shake'] });
    fixture.detectChanges();
    expect(TestBed.inject(CartService).isEmpty()).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain('None of the items');
    fixture.destroy();
  });
});
