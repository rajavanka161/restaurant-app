import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { AuthResponse } from '../core/models';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <div class="mx-auto mt-10 max-w-md">
      <h1 class="display text-3xl">{{ mode() === 'login' ? 'Log in' : 'Create your account' }}</h1>
      <form class="mt-6 space-y-4" (ngSubmit)="submit()" #f="ngForm">
        @if (mode() === 'register') {
          <div>
            <label class="label" for="name">Full name</label>
            <input id="name" name="name" class="field" required [(ngModel)]="fullName" autocomplete="name">
          </div>
        }
        <div>
          <label class="label" for="email">Email</label>
          <input id="email" name="email" type="email" class="field" required [(ngModel)]="email" autocomplete="email">
        </div>
        <div>
          <label class="label" for="password">Password</label>
          <input id="password" name="password" type="password" class="field" required minlength="6" [(ngModel)]="password"
            [attr.autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'">
        </div>
        @if (error()) { <p class="text-sm font-semibold text-ketchup" role="alert">{{ error() }}</p> }
        <button type="submit" class="btn-primary w-full" [disabled]="busy() || f.invalid">{{ mode() === 'login' ? 'Log in' : 'Create account' }}</button>
      </form>
      <button type="button" class="mt-4 text-sm font-semibold underline" (click)="toggle()">
        {{ mode() === 'login' ? 'New here? Create an account' : 'Already have an account? Log in' }}
      </button>

      <div class="mt-8 rounded-2xl border border-dashed border-line bg-white p-4 text-sm">
        <p class="font-semibold">Demo accounts (password Password1!)</p>
        <div class="mt-2 flex flex-wrap gap-2">
          @for (d of demos; track d.email) {
            <button type="button" class="btn-ghost !px-3 !py-1.5 text-sm" (click)="fill(d.email)">{{ d.label }}</button>
          }
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  readonly returnUrl = input<string>();
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected fullName = '';
  protected email = '';
  protected password = '';
  protected readonly demos = [
    { label: 'Customer', email: 'customer@burger.test' },
    { label: 'Kitchen', email: 'kitchen@burger.test' },
    { label: 'Manager', email: 'manager@burger.test' },
  ];

  toggle() { this.mode.update((m) => (m === 'login' ? 'register' : 'login')); this.error.set(''); }

  fill(email: string) { this.mode.set('login'); this.email = email; this.password = 'Password1!'; }

  submit() {
    this.busy.set(true);
    this.error.set('');
    const call = this.mode() === 'login'
      ? this.api.login(this.email, this.password)
      : this.api.register(this.fullName, this.email, this.password);
    call.subscribe({
      next: (res: AuthResponse) => {
        this.auth.signIn(res);
        const dest = this.returnUrl() ?? (res.role === 'Kitchen' ? '/kitchen' : res.role === 'Manager' ? '/admin' : '/');
        this.router.navigateByUrl(dest);
      },
      error: (e) => { this.error.set(errorMessage(e)); this.busy.set(false); },
    });
  }
}
