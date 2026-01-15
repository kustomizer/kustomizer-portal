import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize, switchMap, take } from 'rxjs/operators';
import { AuthFacade } from '../core/facades/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <h1>Access your account</h1>
        <div class="grid" *ngIf="users$ | async as users">
          <button
            class="user-card"
            *ngFor="let user of users"
            type="button"
            (click)="login(user.id)"
            [disabled]="loadingUserId === user.id"
          >
            <div>
              <h3>{{ user.name }}</h3>
              <p>{{ user.email }}</p>
            </div>
            <span class="pill" [class.admin]="user.role === 'admin'">
              {{ user.role === 'admin' ? 'Admin' : 'Client' }}
            </span>
          </button>
        </div>

        <form class="register" [formGroup]="registerForm" (ngSubmit)="register()">
          <div>
            <label>Name</label>
            <input formControlName="name" placeholder="e.g. Camila Torres" />
          </div>
          <div>
            <label>Email</label>
            <input formControlName="email" placeholder="camila@brand.com" />
          </div>
          <button type="submit" [disabled]="registerForm.invalid || registering">
            {{ registering ? 'Creating...' : 'Create workspace' }}
          </button>
        </form>

        <div class="error" *ngIf="errorMessage">{{ errorMessage }}</div>
      </div>

  `,
  styles: [
    `
      .login-shell {
        display: grid;
        gap: 2rem;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        padding: 3rem 1.5rem;
        align-items: start;
      }

      .login-card {
        background: var(--card);
        border-radius: 24px;
        border: 1px solid var(--border);
        box-shadow: var(--shadow-soft);
        display: flex;
        flex-direction: column;
        margin: auto;
        padding: 2rem;
        width: 50%;
      }

      .grid {
        display: grid;
        gap: 1rem;
        margin: 1.5rem 0;
      }

      .user-card {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-radius: 16px;
        background: var(--card-soft);
        border: 1px solid transparent;
        color: var(--foreground);
        cursor: pointer;
        transition: border-color 0.2s ease, transform 0.2s ease;
      }

      .user-card:hover {
        border-color: var(--primary);
        transform: translateY(-1px);
      }

      .user-card h3 {
        margin-bottom: 0.25rem;
      }

      .pill {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
      }

      .pill.admin {
        background: rgba(255, 255, 255, 0.18);
        color: var(--primary);
      }

      .divider span {
        color: var(--muted);
        font-size: 0.8rem;
      }

      .register {
        display: grid;
        gap: 0.75rem;
      }

      label {
        display: block;
        font-size: 0.75rem;
        color: var(--muted);
        margin-bottom: 0.35rem;
      }

      input {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        padding: 0.65rem 0.85rem;
        color: var(--foreground);
      }

      button[type='submit'] {
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        cursor: pointer;
      }

      button[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .error {
        margin-top: 1rem;
        color: var(--danger);
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--primary);
        font-weight: 600;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly users$ = this.auth.listUsers();
  loadingUserId: string | null = null;
  registering = false;
  errorMessage = '';

  readonly registerForm = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  login(userId: string): void {
    // Mock login - in production, use signIn(email, password)
    this.errorMessage = '';
    this.loadingUserId = userId;

    // For mock purposes, get user info first
    this.auth.listUsers()
      .pipe(
        switchMap((users) => {
          const user = users.find(u => u.id === userId);
          if (!user) {
            throw new Error('User not found');
          }
          // In production, this would be: this.auth.signIn(email, password)
          // For mock, we'll just navigate based on role
          const target = user.role === 'admin' ? '/admin' : '/app';
          void this.router.navigate([target]);
          return this.auth.currentUser$.pipe(take(1));
        }),
        finalize(() => {
          this.loadingUserId = null;
        })
      )
      .subscribe({
        next: () => {
          // Navigation already handled above
        },
        error: (error: Error) => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to login.';
        },
      });
  }

  register(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.errorMessage = '';
    this.registering = true;
    const { name, email } = this.registerForm.getRawValue();

    // In production, you'd collect password too
    const defaultPassword = 'password123'; // Mock password

    this.auth
      .signUp(email ?? '', defaultPassword)
      .pipe(
        switchMap(() => this.auth.currentUser$.pipe(take(1))),
        finalize(() => {
          this.registering = false;
        })
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/app']);
        },
        error: (error: Error) => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to register.';
        },
      });
  }
}
