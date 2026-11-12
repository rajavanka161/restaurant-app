import { Component, inject, signal } from '@angular/core';
import { errorMessage } from '../core/api.service';
import { OrderNoteDto } from '../core/models';
import { OrderNotesService } from '../core/order-notes.service';

@Component({
  selector: 'app-order-notes-page',
  template: `
    <h1 class="display py-8 text-4xl">Order notes</h1>
    <div class="flex flex-wrap gap-2">
      <input #orderId type="number" min="1" placeholder="Order id" class="rounded-lg border border-line px-3 py-2" />
      <input #text type="text" maxlength="500" placeholder="Note" class="min-w-64 rounded-lg border border-line px-3 py-2" />
      <button type="button" class="btn-dark" (click)="add(+orderId.value, text.value)">Add note</button>
    </div>
    @if (error()) { <p class="mt-3 font-semibold text-ketchup" role="alert">{{ error() }}</p> }
    @if (latest(); as n) { <p class="mt-3">Latest note on order #{{ n.orderId }}: {{ n.text }}</p> }
  `,
})
export class OrderNotesPage {
  private readonly notes = inject(OrderNotesService);
  protected readonly latest = signal<OrderNoteDto | null>(null);
  protected readonly error = signal('');

  add(orderId: number, text: string) {
    this.error.set('');
    const note: OrderNoteDto = { orderId, text };
    this.notes.add(note).subscribe({
      next: () => this.notes.latest(orderId).subscribe((n) => this.latest.set(n)),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
