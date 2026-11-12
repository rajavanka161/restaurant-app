import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from './api.service';
import { MenuItem } from './models';

const KEY = 'smashline.wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiService);
  private readonly items = new BehaviorSubject<MenuItem[]>([]);

  readonly items$ = this.items.asObservable();

  load() {
    this.api.menu().subscribe((categories) => this.items.next(categories.flatMap((c) => c.items)));
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.items.value.map((i) => i.id))); } catch { /* storage unavailable */ }
  }
}
