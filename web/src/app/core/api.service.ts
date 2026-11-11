import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';
import {
  AuthResponse, CartLine, Category, DailySalesReport, Fulfillment, Ingredient, KitchenOrder, MenuCategory,
  MenuItem, MenuItemUpsert, OrderDetail, OrderStatus, OrderSummary, PlaceOrderRequest, Quote,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string) { return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }); }
  register(fullName: string, email: string, password: string) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, { fullName, email, password });
  }

  menu() { return this.http.get<MenuCategory[]>(`${API_URL}/menu`); }
  menuAll() { return this.http.get<MenuItem[]>(`${API_URL}/menu/all`); }
  categories() { return this.http.get<Category[]>(`${API_URL}/menu/categories`); }
  createMenuItem(body: MenuItemUpsert) { return this.http.post<MenuItem>(`${API_URL}/menu`, body); }
  updateMenuItem(id: number, body: MenuItemUpsert) { return this.http.put<MenuItem>(`${API_URL}/menu/${id}`, body); }

  quote(items: CartLine[], fulfillmentType: Fulfillment, promoCode: string | null) {
    return this.http.post<Quote>(`${API_URL}/cart/quote`, { items, fulfillmentType, promoCode });
  }
  placeOrder(body: PlaceOrderRequest) { return this.http.post<OrderDetail>(`${API_URL}/orders`, body); }
  myOrders() { return this.http.get<OrderSummary[]>(`${API_URL}/orders/mine`); }
  recentOrders() { return this.http.get<OrderSummary[]>(`${API_URL}/orders`); }
  order(id: number) { return this.http.get<OrderDetail>(`${API_URL}/orders/${id}`); }
  cancelOrder(id: number) { return this.http.post<void>(`${API_URL}/orders/${id}/cancel`, {}); }
  refundOrder(id: number) { return this.http.post<void>(`${API_URL}/orders/${id}/refund`, {}); }

  kitchenOrders() { return this.http.get<KitchenOrder[]>(`${API_URL}/kitchen/orders`); }
  setStatus(id: number, status: OrderStatus) { return this.http.post<void>(`${API_URL}/kitchen/orders/${id}/status`, { status }); }

  ingredients() { return this.http.get<Ingredient[]>(`${API_URL}/ingredients`); }
  setStock(id: number, stockQty: number) { return this.http.put<Ingredient>(`${API_URL}/ingredients/${id}/stock`, { stockQty }); }
  dailySales(date: string) {
    return this.http.get<DailySalesReport>(`${API_URL}/reports/daily-sales`, { params: new HttpParams().set('date', date) });
  }
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Try again.'): string {
  const e = err as { error?: { error?: string; errors?: Record<string, string[]> }; status?: number };
  if (e?.error?.error) return e.error.error;
  if (e?.error?.errors) return Object.values(e.error.errors).flat()[0] ?? fallback;
  if (e?.status === 0) return 'Cannot reach the server. Check that the API is running.';
  return fallback;
}
