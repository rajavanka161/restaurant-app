import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { WishlistService } from '../core/wishlist.service';

@Component({
  selector: 'app-wishlist-page',
  imports: [AsyncPipe],
  template: `
    <h1 class="display py-8 text-4xl">Wishlist</h1>
    <button type="button" class="btn-dark" (click)="svc.save()">Save list</button>
    <ul class="mt-4 space-y-1">
      @for (item of svc.items$ | async; track item.id) {
        <li>{{ item.emoji }} {{ item.name }}</li>
      }
    </ul>
  `,
})
export class WishlistPage implements OnInit {
  protected readonly svc = inject(WishlistService);

  ngOnInit() { this.svc.load(); }
}
