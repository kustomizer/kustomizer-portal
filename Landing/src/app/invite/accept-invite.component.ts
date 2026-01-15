import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthFacade } from '../core/facades/auth.facade';
import { MembershipsFacade } from '../core/facades/memberships.facade';
import { DomainError } from '../core/types/domain-error';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card">
        <div class="header">
          <h2>✉️ Team Invitation</h2>
          <p>You've been invited to join a store</p>
        </div>

        <div *ngIf="state === 'checking-auth'" class="state">
          <div class="spinner"></div>
          <p>Checking authentication...</p>
        </div>

        <div *ngIf="state === 'need-login'" class="state">
          <p>Please log in to accept this invitation</p>
          <button type="button" (click)="redirectToLogin()" class="btn-primary">
            Go to Login
          </button>
        </div>

        <div *ngIf="state === 'processing'" class="state">
          <div class="spinner"></div>
          <p>Accepting invitation...</p>
        </div>

        <div *ngIf="state === 'success'" class="state success">
          <div class="icon-success">✓</div>
          <h3>Welcome aboard!</h3>
          <p>You've successfully joined the team.</p>
          <button type="button" (click)="goToDashboard()" class="btn-primary">
            Go to Dashboard
          </button>
        </div>

        <div *ngIf="state === 'error'" class="state error">
          <div class="icon-error">✗</div>
          <h3>Invitation Error</h3>
          <p>{{ errorMessage }}</p>
          <div class="error-actions">
            <button type="button" (click)="retry()" class="btn-secondary">
              Try Again
            </button>
            <button type="button" (click)="goToDashboard()" class="btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: var(--background);
      }

      .card {
        width: 100%;
        max-width: 500px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 3rem 2rem;
        box-shadow: var(--shadow-soft);
      }

      .header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .header h2 {
        margin: 0 0 0.5rem 0;
      }

      .header p {
        color: var(--muted);
        margin: 0;
      }

      .state {
        text-align: center;
        padding: 2rem 0;
      }

      .state p {
        color: var(--muted);
        margin: 1rem 0;
      }

      .state.success {
        color: #10b981;
      }

      .state.error {
        color: #ef4444;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .icon-success,
      .icon-error {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        margin: 0 auto 1rem;
      }

      .icon-success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .icon-error {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .state h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
      }

      .btn-primary,
      .btn-secondary {
        padding: 0.85rem 1.5rem;
        border-radius: 12px;
        border: none;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 1rem;
      }

      .btn-primary {
        background: var(--primary);
        color: #0a0d10;
        width: 100%;
      }

      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-secondary {
        background: var(--card-soft);
        color: var(--foreground);
        border: 1px solid var(--border);
      }

      .btn-secondary:hover {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.1);
      }

      .error-actions {
        display: grid;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }

      @media (max-width: 640px) {
        .card {
          padding: 2rem 1.5rem;
        }
      }
    `,
  ],
})
export class AcceptInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacade);
  private readonly membershipsFacade = inject(MembershipsFacade);

  state: 'checking-auth' | 'need-login' | 'processing' | 'success' | 'error' = 'checking-auth';
  errorMessage = '';
  membershipKey = '';

  ngOnInit(): void {
    this.membershipKey = this.route.snapshot.params['membershipKey'];

    if (!this.membershipKey) {
      this.state = 'error';
      this.errorMessage = 'Invalid invitation link. No membership key provided.';
      return;
    }

    // Check if user is authenticated
    this.authFacade.session$
      .pipe(take(1))
      .subscribe((session) => {
        if (session) {
          // User is authenticated, proceed with acceptance
          this.acceptInvitation();
        } else {
          // User needs to login
          this.state = 'need-login';
          // Store the key in session storage for after login
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('pending_invite_key', this.membershipKey);
          }
        }
      });
  }

  redirectToLogin(): void {
    const redirectUrl = `/invite/${this.membershipKey}`;
    void this.router.navigate(['/login'], {
      queryParams: { redirect: redirectUrl },
    });
  }

  acceptInvitation(): void {
    this.state = 'processing';
    this.errorMessage = '';

    this.membershipsFacade
      .acceptInvitation(this.membershipKey)
      .pipe(
        take(1),
        catchError((error: DomainError) => {
          this.state = 'error';

          if (error.type === 'NotFound') {
            this.errorMessage = 'This invitation is invalid or has already been used.';
          } else if (error.type === 'Forbidden') {
            this.errorMessage = 'You do not have permission to accept this invitation.';
          } else if (error.type === 'Conflict') {
            this.errorMessage = 'This invitation has expired or is no longer valid.';
          } else {
            this.errorMessage =
              error.message || 'Failed to accept invitation. Please try again or contact support.';
          }

          return of(null);
        })
      )
      .subscribe((membership) => {
        if (membership) {
          this.state = 'success';
          // Clear the stored key
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('pending_invite_key');
          }
          // Auto-redirect after 2 seconds
          setTimeout(() => this.goToDashboard(), 2000);
        }
      });
  }

  retry(): void {
    this.acceptInvitation();
  }

  goToDashboard(): void {
    void this.router.navigate(['/app/dashboard']);
  }
}

