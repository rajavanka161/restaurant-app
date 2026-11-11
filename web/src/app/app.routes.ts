import { Routes } from '@angular/router';
import { requireLogin, requireRole } from './core/guards';

export const routes: Routes = [
  { path: '', title: 'Smashline Burgers', loadComponent: () => import('./pages/menu.page').then((m) => m.MenuPage) },
  { path: 'login', title: 'Log in', loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage) },
  { path: 'checkout', title: 'Checkout', canActivate: [requireLogin], loadComponent: () => import('./pages/checkout.page').then((m) => m.CheckoutPage) },
  { path: 'orders', title: 'My orders', canActivate: [requireLogin], loadComponent: () => import('./pages/orders.page').then((m) => m.OrdersPage) },
  { path: 'orders/:id', title: 'Order status', canActivate: [requireLogin], loadComponent: () => import('./pages/order-detail.page').then((m) => m.OrderDetailPage) },
  { path: 'kitchen', title: 'Kitchen', canActivate: [requireRole('Kitchen', 'Manager')], loadComponent: () => import('./pages/kitchen.page').then((m) => m.KitchenPage) },
  {
    path: 'admin',
    canActivate: [requireRole('Manager')],
    loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'report' },
      { path: 'report', title: 'Daily sales', loadComponent: () => import('./pages/admin/report.page').then((m) => m.ReportPage) },
      { path: 'orders', title: 'Orders', loadComponent: () => import('./pages/admin/admin-orders.page').then((m) => m.AdminOrdersPage) },
      { path: 'menu', title: 'Edit menu', loadComponent: () => import('./pages/admin/admin-menu.page').then((m) => m.AdminMenuPage) },
      { path: 'stock', title: 'Ingredient stock', loadComponent: () => import('./pages/admin/admin-stock.page').then((m) => m.AdminStockPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
