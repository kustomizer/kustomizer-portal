import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthFacade } from '../core/facades/auth.facade';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-shell">
      <div class="login-card">
        <h1>Access your account</h1>
        <form class="login-form" [formGroup]="loginForm" (ngSubmit)="login()">
          <div>
            <label>Email</label>
            <input formControlName="email" placeholder="you@company.com" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="••••••••" />
          </div>
          <button type="submit" [disabled]="loginForm.invalid || loggingIn">
            {{ loggingIn ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <div class="divider"><span>or</span></div>

        <form class="register" [formGroup]="registerForm" (ngSubmit)="register()">
          <div>
            <label>Name</label>
            <input formControlName="name" placeholder="e.g. Camila Torres" />
          </div>
          <div>
            <label>Email</label>
            <input formControlName="email" placeholder="camila@brand.com" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Minimum 8 characters" />
          </div>
          <button type="submit" [disabled]="registerForm.invalid || registering">
            {{ registering ? 'Creating...' : 'Create account' }}
          </button>
        </form>

        <div class="info" *ngIf="infoMessage">{{ infoMessage }}</div>
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
        width: 100%;
        max-width: 480px;
      }

      .divider span {
        color: var(--muted);
        font-size: 0.8rem;
      }

      .divider {
        display: flex;
        justify-content: center;
        margin: 1.25rem 0;
      }

      .login-form,
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

      .info {
        margin-top: 1rem;
        color: var(--muted);
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
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  loggingIn = false;
  registering = false;
  errorMessage = '';
  infoMessage = '';

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly registerForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  login(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.errorMessage = '';
    this.infoMessage = '';
    this.loggingIn = true;
    const { email, password } = this.loginForm.getRawValue();

    this.auth
      .signIn(email ?? '', password ?? '')
      .pipe(
        finalize(() => {
          this.loggingIn = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          void this.router.navigate([this.resolveRedirectTarget()]);
        },
        error: (error: Error) => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to login.';
          this.cdr.detectChanges();
        },
      });
  }

  register(): void {
    if (this.registerForm.invalid) {
      return;
    }
    this.errorMessage = '';
    this.infoMessage = '';
    this.registering = true;
    const { name, email, password } = this.registerForm.getRawValue();

    this.auth
      .signUp(email ?? '', password ?? '', name ?? undefined)
      .pipe(
        finalize(() => {
          this.registering = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (session) => {
          if (session) {
            void this.router.navigate(['/app/dashboard'], {
              queryParams: { onboarding: 'shopify' },
            });
            return;
          }
          this.infoMessage = 'Check your email to confirm your account before signing in.';
          this.cdr.detectChanges();
        },
        error: (error: Error) => {
          this.errorMessage = error instanceof Error ? error.message : 'Unable to register.';
          this.cdr.detectChanges();
        },
      });
  }

  private resolveRedirectTarget(): string {
    return this.route.snapshot.queryParamMap.get('redirectTo') || '/app';
  }
}
