import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { ApiService, errorMessage } from '../core/api.service';
import { loadMenu, loadMenuFailure, loadMenuSuccess } from './menu.actions';

@Injectable()
export class MenuEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(ApiService);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMenu),
      switchMap(() =>
        this.api.menu().pipe(
          map((categories) => loadMenuSuccess({ categories })),
          catchError((e) => of(loadMenuFailure({ error: errorMessage(e) }))),
        ),
      ),
    ),
  );
}
