import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, errorMessage } from '../../core/api.service';
import { Ingredient } from '../../core/models';

@Component({
  selector: 'app-admin-stock-page',
  imports: [FormsModule],
  template: `
    @if (error()) { <p class="mb-3 font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    <p class="mb-3 text-sm text-ink-soft">Orders use up ingredients automatically, and cancelled orders put them back. Set the count after a delivery or stock take.</p>
    <div class="overflow-x-auto rounded-2xl border border-line bg-white">
      <table class="w-full text-left text-sm">
        <thead class="border-b border-line text-ink-soft">
          <tr><th class="p-3">Ingredient</th><th class="p-3">In stock</th><th class="p-3">Reorder at</th><th class="p-3"></th><th class="p-3"><span class="sr-only">Save</span></th></tr>
        </thead>
        <tbody>
          @for (i of items(); track i.id) {
            <tr class="border-b border-line last:border-0">
              <td class="p-3 font-semibold">{{ i.name }}</td>
              <td class="p-3">
                <input type="number" min="0" class="field !w-28 !py-1.5" [ngModel]="i.stockQty" (ngModelChange)="i.stockQty = $event; dirty.add(i.id)" [attr.aria-label]="'Stock for ' + i.name">
                <span class="ml-1 text-ink-soft">{{ i.unit }}</span>
              </td>
              <td class="p-3">{{ i.reorderLevel }} {{ i.unit }}</td>
              <td class="p-3">
                @if (i.stockQty <= i.reorderLevel) { <span class="rounded-full bg-ketchup px-2.5 py-0.5 text-xs font-bold text-white">Low stock</span> }
              </td>
              <td class="p-3 text-right"><button type="button" class="btn-dark !px-4 !py-1.5" [disabled]="!dirty.has(i.id)" (click)="save(i)">Save</button></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class AdminStockPage implements OnInit {
  private readonly api = inject(ApiService);
  protected readonly items = signal<Ingredient[]>([]);
  protected readonly error = signal('');
  protected readonly dirty = new Set<number>();

  ngOnInit() { this.api.ingredients().subscribe({ next: (i) => this.items.set(i), error: (e) => this.error.set(errorMessage(e)) }); }

  save(i: Ingredient) {
    this.api.setStock(i.id, i.stockQty).subscribe({
      next: () => { this.dirty.delete(i.id); this.error.set(''); this.items.update((l) => [...l]); },
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
