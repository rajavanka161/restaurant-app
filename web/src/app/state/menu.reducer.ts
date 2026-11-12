import { createReducer, createSelector, on } from '@ngrx/store';
import { MenuCategory } from '../core/models';
import { loadMenu, loadMenuFailure, loadMenuSuccess } from './menu.actions';

export interface MenuState { categories: MenuCategory[]; loading: boolean; error: string | null; }

const initialState: MenuState = { categories: [], loading: false, error: null };

export const menuReducer = createReducer(
  initialState,
  on(loadMenu, (state) => ({ ...state, loading: true, error: null })),
  on(loadMenuSuccess, (state, { categories }) => ({ ...state, categories, loading: false })),
  on(loadMenuFailure, (state, { error }) => ({ ...state, loading: false, error })),
);

export const selectMenu = (root: { menu: MenuState }) => root.menu;
export const selectItemCount = createSelector(selectMenu, (m) => m.categories.reduce((n, c) => n + c.items.length, 0));
