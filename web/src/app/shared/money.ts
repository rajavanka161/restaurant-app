import { CurrencyPipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-money',
  imports: [CurrencyPipe],
  template: `{{ amount() | currency }}`,
})
export class Money {
  readonly amount = input.required<number>();
}
