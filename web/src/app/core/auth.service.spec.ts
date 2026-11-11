import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => { localStorage.clear(); TestBed.resetTestingModule(); });

  it('starts signed out', () => {
    const a = TestBed.inject(AuthService);
    expect(a.isLoggedIn()).toBe(false);
    expect(a.token()).toBeNull();
  });

  it('exposes role helpers after sign in and persists the session', () => {
    const a = TestBed.inject(AuthService);
    a.signIn({ token: 't', fullName: 'Kim', role: 'Kitchen' });
    expect(a.isStaff()).toBe(true);
    expect(a.isManager()).toBe(false);
    expect(a.hasRole('Kitchen', 'Manager')).toBe(true);
    expect(JSON.parse(localStorage.getItem('smashline.auth')!).token).toBe('t');
  });

  it('restores a stored session and clears it on sign out', () => {
    localStorage.setItem('smashline.auth', JSON.stringify({ token: 'abc', fullName: 'Morgan', role: 'Manager' }));
    const a = TestBed.inject(AuthService);
    expect(a.isManager()).toBe(true);
    a.signOut();
    expect(a.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('smashline.auth')).toBeNull();
  });

  it('ignores a corrupt stored session', () => {
    localStorage.setItem('smashline.auth', '{not json');
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
  });
});
