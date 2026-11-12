import { Component, inject, input } from '@angular/core';
import { CartService } from '../core/cart.service';
import { Category } from '../core/models';

@Component({
  selector: 'app-review-page',
  template: `
    <h1 class="display py-8 text-4xl">Review your cart</h1>
    <p>{{ cart.count() }} items across {{ categories().length }} menu categories.</p>
  `,
})
export class ReviewPage {
  protected readonly cart = inject(CartService);
  readonly categories = input<Category[]>([]);
}
