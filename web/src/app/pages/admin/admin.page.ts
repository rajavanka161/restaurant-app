import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-page',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <h1 class="display pt-8 text-4xl">Manage</h1>
    <nav class="my-5 flex flex-wrap gap-2" aria-label="Manager sections">
      @for (t of tabs; track t.path) {
        <a [routerLink]="t.path" routerLinkActive="!border-ink !bg-ink !text-white" class="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold hover:bg-mustard/40">{{ t.label }}</a>
      }
    </nav>
    <router-outlet />
  `,
})
export class AdminPage {
  protected readonly tabs = [
    { path: 'report', label: 'Daily sales' },
    { path: 'trends', label: 'Sales trends' },
    { path: 'orders', label: 'Orders' },
    { path: 'menu', label: 'Menu and prices' },
    { path: 'stock', label: 'Ingredient stock' },
  ];
}
