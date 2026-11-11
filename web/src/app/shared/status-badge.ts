import { Component, input } from '@angular/core';
import { OrderStatus } from '../core/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold" [class]="cls()">{{ status() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();
  protected cls() {
    switch (this.status()) {
      case 'Received': return 'bg-mustard text-ink';
      case 'Preparing': return 'bg-ketchup text-white';
      case 'Ready': return 'bg-pickle text-white';
      case 'Completed': return 'bg-ink text-white';
      case 'Cancelled': return 'bg-line text-ink-soft';
    }
  }
}
