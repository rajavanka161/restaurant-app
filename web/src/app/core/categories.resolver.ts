import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ApiService } from './api.service';
import { Category } from './models';

export const categoriesResolver: ResolveFn<Category[]> = () => inject(ApiService).categories();
