import { Component, input } from '@angular/core';

@Component({
  selector: 'app-promo-banner',
  template: `<p class="rounded-xl bg-mustard px-4 py-2 font-semibold">{{ message() }}</p>`,
})
export class PromoBanner {
  readonly message = input.required<string>();
}
