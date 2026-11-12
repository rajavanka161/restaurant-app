import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';
import { MenuItem } from './models';

@Injectable({ providedIn: 'root' })
export class MenuSectionService {
  private readonly http = inject(HttpClient);

  section(name: string) {
    const url = [API_URL, 'menu', name].join('/');
    return this.http.get<MenuItem[]>(url);
  }
}
