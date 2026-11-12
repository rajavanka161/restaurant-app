import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { CategoryService } from './category.service';
import { Category } from './models';

describe('CategoryService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  it('requests the categories endpoint under the environment api url', () => {
    const categories: Category[] = [{ id: 1, name: 'Burgers', sortOrder: 1 }];
    let result: Category[] | undefined;
    TestBed.inject(CategoryService).list().subscribe((c) => (result = c));

    const req = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/menu/categories`);
    expect(req.request.method).toBe('GET');
    req.flush(categories);

    expect(result).toEqual(categories);
  });
});
