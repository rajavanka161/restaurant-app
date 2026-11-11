import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

@Injectable({ providedIn: 'root' })
export class HttpGateway {
  private readonly http = inject(HttpClient);

  get<T>(path: string) { return this.http.get<T>(`${API_URL}${path}`); }
}
