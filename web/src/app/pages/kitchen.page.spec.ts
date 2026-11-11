import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { KitchenOrder } from '../core/models';
import { KitchenPage } from './kitchen.page';

const order = (id: number, status: KitchenOrder['order']['status']): KitchenOrder => ({
  order: {
    id, userId: 1, customerName: 'Casey', fulfillmentType: 'Pickup', status, paymentStatus: 'Paid', subtotal: 10, discount: 0,
    tax: 0.8, deliveryFee: 0, total: 10.8, promoCode: null, deliveryAddress: null, phone: null,
    createdAt: '2026-11-11T08:00:00', updatedAt: '2026-11-11T08:00:00', itemCount: 2,
  },
  items: [{ name: 'Classic Smash', unitPrice: 8.99, quantity: 2, lineTotal: 17.98 }],
});

describe('KitchenPage', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  it('sorts orders into columns and shows their items', async () => {
    const fixture = TestBed.createComponent(KitchenPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/kitchen/orders')).flush([order(1, 'Received'), order(2, 'Preparing'), order(3, 'Ready')]);
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('section').length).toBe(3);
    expect(el.textContent).toContain('2 × Classic Smash');
    expect(el.textContent).toContain('Start preparing');
    expect(el.textContent).toContain('Mark ready');
    expect(el.textContent).toContain('Hand off');
    fixture.destroy();
  });

  it('advances an order to the next status then reloads the board', async () => {
    const fixture = TestBed.createComponent(KitchenPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/kitchen/orders')).flush([order(7, 'Received')]);
    await fixture.whenStable();
    fixture.detectChanges();
    ([...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) => b.textContent?.includes('Start preparing')) as HTMLButtonElement).click();
    const post = http.expectOne((r) => r.url.endsWith('/kitchen/orders/7/status'));
    expect(post.request.body).toEqual({ status: 'Preparing' });
    post.flush(null);
    http.expectOne((r) => r.url.endsWith('/kitchen/orders')).flush([order(7, 'Preparing')]);
    fixture.destroy();
  });

  it('shows the server error when a status change is rejected', async () => {
    const fixture = TestBed.createComponent(KitchenPage);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/kitchen/orders')).flush([order(7, 'Received')]);
    await fixture.whenStable();
    fixture.detectChanges();
    ([...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find((b) => b.textContent?.includes('Start preparing')) as HTMLButtonElement).click();
    http.expectOne((r) => r.url.endsWith('/status')).flush({ error: 'Cannot move order from Received to Ready.' }, { status: 409, statusText: 'Conflict' });
    http.expectOne((r) => r.url.endsWith('/kitchen/orders')).flush([order(7, 'Received')]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain('Cannot move order');
    fixture.destroy();
  });
});
