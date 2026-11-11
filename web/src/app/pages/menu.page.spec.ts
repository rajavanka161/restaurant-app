import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CartService } from '../core/cart.service';
import { MenuCategory } from '../core/models';
import { MenuPage } from './menu.page';

const menu: MenuCategory[] = [
  { id: 1, name: 'Burgers', items: [{ id: 1, categoryId: 1, category: 'Burgers', name: 'Classic Smash', description: 'Beef', price: 8.99, emoji: '🍔', calories: 720, isAvailable: true }] },
  { id: 3, name: 'Sides', items: [{ id: 5, categoryId: 3, category: 'Sides', name: 'Hand-cut Fries', description: 'Salty', price: 3.99, emoji: '🍟', calories: null, isAvailable: true }] },
];

describe('MenuPage', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  async function render() {
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/menu')).flush(menu);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('shows every item with its price', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Classic Smash');
    expect(el.textContent).toContain('$8.99');
    expect(el.textContent).toContain('Hand-cut Fries');
  });

  it('filters by category', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    ([...el.querySelectorAll('nav button')].find((b) => b.textContent?.trim() === 'Sides') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Hand-cut Fries');
    expect(el.textContent).not.toContain('Classic Smash');
  });

  it('adds an item to the cart from the Add button', async () => {
    const fixture = await render();
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('li button.btn-primary') as HTMLButtonElement).click();
    expect(TestBed.inject(CartService).count()).toBe(1);
  });

  it('shows a readable message when the menu cannot load', async () => {
    const fixture = TestBed.createComponent(MenuPage);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne((r) => r.url.endsWith('/menu')).flush({}, { status: 500, statusText: 'x' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent).toContain('could not be loaded');
  });
});
