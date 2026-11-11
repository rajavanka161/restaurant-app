import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CartService } from './core/cart.service';
import { CartDrawer } from './shared/cart-drawer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CartDrawer],
  template: `
    <header class="sticky top-0 z-30 bg-mustard">
      <div class="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
        <a routerLink="/" class="display shrink-0 text-xl text-ink sm:text-2xl">Smashline</a>
        <nav class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm font-semibold" aria-label="Main">
          <a routerLink="/" routerLinkActive="bg-ink text-white" [routerLinkActiveOptions]="{ exact: true }" class="rounded-full px-3 py-1.5 hover:bg-mustard-deep">Menu</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/orders" routerLinkActive="bg-ink text-white" class="rounded-full px-3 py-1.5 hover:bg-mustard-deep">My orders</a>
          }
          @if (auth.isStaff()) {
            <a routerLink="/kitchen" routerLinkActive="bg-ink text-white" class="rounded-full px-3 py-1.5 hover:bg-mustard-deep">Kitchen</a>
          }
          @if (auth.isManager()) {
            <a routerLink="/admin" routerLinkActive="bg-ink text-white" class="rounded-full px-3 py-1.5 hover:bg-mustard-deep">Manage</a>
          }
        </nav>
        @if (auth.user(); as u) {
          <span class="hidden text-sm sm:inline">{{ u.fullName }}</span>
          <button type="button" class="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-mustard-deep" (click)="logout()">Log out</button>
        } @else {
          <a routerLink="/login" class="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-mustard-deep">Log in</a>
        }
        <button type="button" class="btn-dark relative shrink-0 !px-4 !py-2" (click)="cart.open.set(true)" [attr.aria-label]="'Open cart, ' + cart.count() + ' items'">
          Cart
          @if (cart.count() > 0) {
            <span class="grid h-5 min-w-5 place-items-center rounded-full bg-ketchup px-1 text-xs">{{ cart.count() }}</span>
          }
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-4 pb-20"><router-outlet /></main>
    <app-cart-drawer />
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  logout() {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
}
