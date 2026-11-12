import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CategoryService } from '../core/category.service';

@Component({
  selector: 'app-about-page',
  imports: [AsyncPipe, RouterLink],
  template: `
    <h1 class="display py-8 text-4xl">About Smashline</h1>
    <p class="mb-4">
      We serve:
      @for (c of categories$ | async; track c.id) { <span class="mr-2 font-semibold">{{ c.name }}</span> }
    </p>
    <ul class="space-y-2 font-semibold underline">
      <li><a routerLink="/info/hours">Opening hours</a></li>
      <li><a routerLink="/info/contact">Contact</a></li>
      <li><a routerLink="/review">Review your cart</a></li>
      <li><a routerLink="/wishlist">Wishlist</a></li>
      <li><a routerLink="/overview">Menu overview</a></li>
      @if (auth.isStaff()) { <li><a routerLink="/order-notes">Order notes</a></li> }
    </ul>
  `,
})
export class AboutPage {
  protected readonly auth = inject(AuthService);
  protected readonly categories$ = inject(CategoryService).list();
}
