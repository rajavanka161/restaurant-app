import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { requireLogin, requireRole } from './guards';

const run = (guard: ReturnType<typeof requireRole>) =>
  TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, { url: '/kitchen' } as RouterStateSnapshot));

describe('route guards', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('sends anonymous users to login with a return url', () => {
    const result = run(requireLogin) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login?returnUrl=%2Fkitchen');
  });

  it('lets a logged in user through', () => {
    TestBed.inject(AuthService).signIn({ token: 't', fullName: 'C', role: 'Customer' });
    expect(run(requireLogin)).toBe(true);
  });

  it('blocks customers from staff pages and allows kitchen', () => {
    const auth = TestBed.inject(AuthService);
    auth.signIn({ token: 't', fullName: 'C', role: 'Customer' });
    expect(run(requireRole('Kitchen', 'Manager'))).toBeInstanceOf(UrlTree);
    auth.signIn({ token: 't', fullName: 'K', role: 'Kitchen' });
    expect(run(requireRole('Kitchen', 'Manager'))).toBe(true);
    expect(run(requireRole('Manager'))).toBeInstanceOf(UrlTree);
  });
});
