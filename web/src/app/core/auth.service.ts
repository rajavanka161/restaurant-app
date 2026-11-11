import { Injectable, computed, signal } from '@angular/core';
import { AuthResponse, Role } from './models';

const KEY = 'smashline.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly state = signal<AuthResponse | null>(this.load());

  readonly user = this.state.asReadonly();
  readonly token = computed(() => this.state()?.token ?? null);
  readonly role = computed<Role | null>(() => this.state()?.role ?? null);
  readonly isLoggedIn = computed(() => this.state() !== null);
  readonly isStaff = computed(() => this.role() === 'Kitchen' || this.role() === 'Manager');
  readonly isManager = computed(() => this.role() === 'Manager');

  signIn(auth: AuthResponse) {
    this.state.set(auth);
    try { localStorage.setItem(KEY, JSON.stringify(auth)); } catch { /* storage unavailable */ }
  }

  signOut() {
    this.state.set(null);
    try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  }

  hasRole(...roles: Role[]): boolean {
    const r = this.role();
    return r !== null && roles.includes(r);
  }

  private load(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}
