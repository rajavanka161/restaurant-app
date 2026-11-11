import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, errorMessage } from '../../core/api.service';
import { Category, MenuItem, MenuItemUpsert } from '../../core/models';

@Component({
  selector: 'app-admin-menu-page',
  imports: [FormsModule],
  template: `
    @if (error()) { <p class="mb-3 font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    @if (saved()) { <p class="mb-3 font-semibold text-pickle" role="status">{{ saved() }}</p> }

    <section class="mb-6 rounded-2xl border border-line bg-white p-4">
      <h2 class="mb-3 font-bold">Add a menu item</h2>
      <form class="grid gap-3 sm:grid-cols-6" (ngSubmit)="create()" #nf="ngForm">
        <input name="emoji" class="field sm:col-span-1" placeholder="🍔" [(ngModel)]="draft.emoji" aria-label="Emoji">
        <input name="name" class="field sm:col-span-3" placeholder="Name" required [(ngModel)]="draft.name" aria-label="Name">
        <input name="price" type="number" step="0.01" min="0" class="field sm:col-span-1" placeholder="Price" required [(ngModel)]="draft.price" aria-label="Price">
        <select name="cat" class="field sm:col-span-1" required [(ngModel)]="draft.categoryId" aria-label="Category">
          @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
        </select>
        <input name="desc" class="field sm:col-span-5" placeholder="Description" [(ngModel)]="draft.description" aria-label="Description">
        <button type="submit" class="btn-primary sm:col-span-1" [disabled]="nf.invalid">Add item</button>
      </form>
    </section>

    <div class="overflow-x-auto rounded-2xl border border-line bg-white">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-line text-ink-soft">
          <tr><th class="p-3">Item</th><th class="p-3">Category</th><th class="p-3">Price</th><th class="p-3">On the menu</th><th class="p-3"><span class="sr-only">Save</span></th></tr>
        </thead>
        <tbody>
          @for (i of items(); track i.id) {
            <tr class="border-b border-line last:border-0">
              <td class="p-3 font-semibold">{{ i.emoji }} {{ i.name }}</td>
              <td class="p-3">{{ i.category }}</td>
              <td class="p-3">
                <input type="number" step="0.01" min="0" class="field !w-24 !py-1.5" [ngModel]="i.price" (ngModelChange)="i.price = $event; dirty.add(i.id)" [attr.aria-label]="'Price for ' + i.name">
              </td>
              <td class="p-3">
                <label class="inline-flex items-center gap-2">
                  <input type="checkbox" [ngModel]="i.isAvailable" (ngModelChange)="i.isAvailable = $event; dirty.add(i.id)"> {{ i.isAvailable ? 'Available' : 'Hidden' }}
                </label>
              </td>
              <td class="p-3 text-right">
                <button type="button" class="btn-dark !px-4 !py-1.5" [disabled]="!dirty.has(i.id)" (click)="save(i)">Save</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminMenuPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly items = signal<MenuItem[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly error = signal('');
  protected readonly saved = signal('');
  protected readonly dirty = new Set<number>();
  protected draft: MenuItemUpsert = this.blank();

  ngOnInit() {
    this.api.categories().subscribe((c) => { this.categories.set(c); this.draft.categoryId = c[0]?.id ?? 0; });
    this.load();
  }

  private blank(): MenuItemUpsert {
    return { name: '', description: '', price: 0, categoryId: 0, emoji: '🍔', calories: null, isAvailable: true };
  }

  private load() {
    this.api.menuAll().subscribe({ next: (i) => this.items.set(i), error: (e) => this.error.set(errorMessage(e)) });
  }

  save(i: MenuItem) {
    this.api.updateMenuItem(i.id, { name: i.name, description: i.description, price: i.price, categoryId: i.categoryId, emoji: i.emoji, calories: i.calories, isAvailable: i.isAvailable }).subscribe({
      next: () => { this.dirty.delete(i.id); this.error.set(''); this.saved.set(`${i.name} saved.`); },
      error: (e) => { this.saved.set(''); this.error.set(errorMessage(e)); },
    });
  }

  create() {
    this.api.createMenuItem(this.draft).subscribe({
      next: (m) => {
        this.saved.set(`${m.name} added to the menu.`);
        this.error.set('');
        this.draft = { ...this.blank(), categoryId: this.draft.categoryId };
        this.load();
      },
      error: (e) => { this.saved.set(''); this.error.set(errorMessage(e)); },
    });
  }
}
