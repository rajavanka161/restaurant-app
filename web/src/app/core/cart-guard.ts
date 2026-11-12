import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from './cart.service';

export const requireNonEmptyCart: CanActivateFn = () => {
  const cart = inject(CartService);
  return !cart.isEmpty() || inject(Router).createUrlTree(['/']);
};
