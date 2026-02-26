import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { StoreUsersFacade } from '../../../core/facades/store-users.facade';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';
import { StoreUserRole, StoreUserStatus } from '../../../core/types/enums';

@Component({
  selector: 'app-portal-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="header">
      <h2>Team Management</h2>
      <p>Invite team members and manage access to your store</p>
      <ng-container *ngIf="activeStore$ | async as store">
        <p class="muted">Managing access for {{ store.name }} ({{ store.shopifyDomain }})</p>
      </ng-container>
    </div>

    <section class="card">
      <h3>Invite Teammate</h3>
      <form [formGroup]="inviteForm" (ngSubmit)="sendInvite()" class="invite-form">
        <div class="form-row">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="colleague@example.com"
              [disabled]="isSending"
            />
            <div
              *ngIf="inviteForm.get('email')?.invalid && inviteForm.get('email')?.touched"
              class="error-msg"
            >
              Please enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" formControlName="role" [disabled]="isSending">
              <option [value]="StoreUserRole.Admin">Admin</option>
              <option [value]="StoreUserRole.Reader">Read-only</option>
            </select>
          </div>
        </div>

        <button type="submit" class="btn-primary" [disabled]="inviteForm.invalid || isSending">
          {{ isSending ? 'Sending...' : 'Add User' }}
        </button>

        <div *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</div>
        <div *ngIf="successMessage" class="success-msg">{{ successMessage }}</div>
      </form>
    </section>

    <section class="card">
      <h3>Team Members</h3>
      <ng-container *ngIf="vm$ | async as vm">
        <div *ngIf="vm.state === 'loading'" class="state">Loading members...</div>
        <div *ngIf="vm.state === 'error'" class="state error">{{ vm.error }}</div>
        <div *ngIf="vm.state === 'empty'" class="state">
          No team members yet. Invite someone to get started!
        </div>
        <div *ngIf="vm.state === 'ready' && vm.data" class="members-list">
          <div class="member-item" *ngFor="let member of vm.data.users">
            <div class="member-info">
              <div class="member-header">
                <h4>{{ member.email }}</h4>
                <span class="badge" [class]="'badge-' + member.status">
                  {{ member.statusLabel }}
                </span>
              </div>
              <p class="muted">
                {{ member.roleLabel }} • Joined {{ member.createdAt | date: 'mediumDate' }}
              </p>
            </div>
            <div class="member-actions">
              <button
                type="button"
                class="btn-secondary"
                (click)="removeUser(member.email)"
                [disabled]="member.status === StoreUserStatus.Removed || member.role === StoreUserRole.Owner"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </section>

    <div class="info-box">
      <h4>ℹ️ Team Roles</h4>
      <ul>
        <li><strong>Owner:</strong> Full access to the portal and team management</li>
        <li><strong>Admin:</strong> Full access to the Kustomizer editor for this store</li>
        <li><strong>Read-only:</strong> Can view the editor but cannot publish changes</li>
      </ul>
    </div>
  `,
  styles: [
    `
      .header {
        margin-bottom: 2rem;
      }

      .header p {
        color: var(--muted);
        margin-top: 0.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 1.5rem;
      }

      .card h3 {
        margin: 0 0 1.5rem 0;
      }

      .invite-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .form-row {
        display: grid;
        gap: 1rem;
        grid-template-columns: 2fr 1fr;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.9rem;
        font-weight: 600;
      }

      input,
      select {
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--foreground);
        font-size: 1rem;
      }

      input:focus,
      select:focus {
        outline: none;
        border-color: var(--primary);
      }

      input:disabled,
      select:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        padding: 0.85rem 1.5rem;
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary:hover:not(:disabled) {
        opacity: 0.9;
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .error-msg {
        color: var(--danger);
        font-size: 0.85rem;
      }

      .success-msg {
        color: #10b981;
        font-size: 0.85rem;
      }

      .state {
        color: var(--muted);
        padding: 2rem 0;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
      }

      .members-list {
        display: grid;
        gap: 0.75rem;
      }

      .member-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        border-radius: 14px;
        background: var(--card-soft);
        border: 1px solid var(--border);
      }

      .member-info {
        flex: 1;
      }

      .member-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
      }

      .member-header h4 {
        margin: 0;
        font-size: 1rem;
      }

      .badge {
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge-pending {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
      }

      .badge-active {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .badge-removed {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .muted {
        color: var(--muted);
        font-size: 0.85rem;
        margin: 0;
      }

      .info-box {
        padding: 1.5rem;
        border-radius: 16px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid #3b82f6;
      }

      .info-box h4 {
        margin: 0 0 1rem 0;
        color: #3b82f6;
      }

      .info-box ul {
        margin: 0;
        padding-left: 1.5rem;
        color: var(--muted);
      }

      .info-box li {
        margin-bottom: 0.5rem;
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }

        .member-item {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class PortalTeamComponent {
  private readonly storeContext = inject(StoreContextFacade);
  private readonly storeUsersFacade = inject(StoreUsersFacade);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly vm$ = this.storeUsersFacade.vm$;
  readonly activeStore$ = this.storeContext.getActiveStore();
  readonly StoreUserRole = StoreUserRole;
  readonly StoreUserStatus = StoreUserStatus;

  isSending = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: [StoreUserRole.Admin, Validators.required],
  });

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      return;
    }

    const { email, role } = this.inviteForm.value;
    if (!email || role === undefined) {
      return;
    }

    this.isSending = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.cdr.detectChanges();

    this.storeUsersFacade
      .inviteUser(email, role)
      .pipe(
        take(1),
        finalize(() => {
          this.isSending = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'User added to store.';
          this.inviteForm.reset({ email: '', role: StoreUserRole.Admin });
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to send invitation. Please try again.';
          this.cdr.detectChanges();
        },
      });
  }

  removeUser(email: string): void {
    this.errorMessage = null;
    this.cdr.detectChanges();
    this.storeUsersFacade
      .removeUser(email)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.successMessage = 'User removed.';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to remove user.';
          this.cdr.detectChanges();
        },
      });
  }
}
