import { Routes } from '@angular/router';

export const INFO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hours' },
  { path: 'hours', title: 'Opening hours', loadComponent: () => import('./hours.page').then((m) => m.HoursPage) },
  { path: 'contact', title: 'Contact', loadComponent: () => import('./contact.page').then((m) => m.ContactPage) },
];
