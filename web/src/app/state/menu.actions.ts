import { createAction, props } from '@ngrx/store';
import { MenuCategory } from '../core/models';

export const loadMenu = createAction('[Menu] Load');
export const loadMenuSuccess = createAction('[Menu] Load Success', props<{ categories: MenuCategory[] }>());
export const loadMenuFailure = createAction('[Menu] Load Failure', props<{ error: string }>());
