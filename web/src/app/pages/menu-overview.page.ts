import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadMenu } from '../state/menu.actions';
import { selectItemCount, selectMenu } from '../state/menu.reducer';

@Component({
  selector: 'app-menu-overview-page',
  template: `
    <h1 class="display py-8 text-4xl">Menu overview</h1>
    @if (menu().error) { <p class="font-semibold text-ketchup" role="alert">{{ menu().error }}</p> }
    <p>{{ itemCount() }} items in {{ menu().categories.length }} categories.</p>
  `,
})
export class MenuOverviewPage implements OnInit {
  private readonly store = inject(Store);
  protected readonly menu = this.store.selectSignal(selectMenu);
  protected readonly itemCount = this.store.selectSignal(selectItemCount);

  ngOnInit() { this.store.dispatch(loadMenu()); }
}
