import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';
import { OrderNoteDto } from './models';

@Injectable({ providedIn: 'root' })
export class OrderNotesService {
  private readonly http = inject(HttpClient);

  add(note: OrderNoteDto) { return this.http.post<void>(`${API_URL}/order-notes`, note); }
  latest(orderId: number) { return this.http.get<OrderNoteDto>(`${API_URL}/order-notes/${orderId}/latest`); }
}
