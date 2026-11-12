import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about-page',
  imports: [RouterLink],
  template: `
    <h1 class="display py-8 text-4xl">About Smashline</h1>
    <ul class="space-y-2 font-semibold underline">
      <li><a routerLink="/info/hours">Opening hours</a></li>
      <li><a routerLink="/info/contact">Contact</a></li>
      <li><a routerLink="/review">Review your cart</a></li>
      <li><a routerLink="/wishlist">Wishlist</a></li>
    </ul>
  `,
})
export class AboutPage {}
