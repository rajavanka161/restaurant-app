import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { HttpGateway } from './http-gateway';
import { MenuItem } from './models';

@Injectable({ providedIn: 'root' })
export class MenuCountService {
  private readonly gateway = inject(HttpGateway);

  count() { return this.gateway.get<MenuItem[]>('/menu/all').pipe(map((items) => items.length)); }
}
