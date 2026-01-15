import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, take } from 'rxjs/operators';
import { MembershipsFacade } from '../../../core/facades/memberships.facade';
import { MembershipRole } from '../../../core/types/enums';

@Component({
  selector: 'app-portal-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="header">
      <h2>Team Management</h2>
      <p>Invite team members and manage access to your store</p>
    </div>

    <section class="card">
      <h3>Invite New Member</h3>
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
              <option [value]="MembershipRole.Member">Member</option>
              <option [value]="MembershipRole.Admin">Admin</option>
              <option [value]="MembershipRole.Owner">Owner</option>
            </select>
          </div>
        </div>

        <button type="submit" class="btn-primary" [disabled]="inviteForm.invalid || isSending">
          {{ isSending ? 'Sending Invitation...' : 'Send Invitation' }}
        </button>

        <div *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</div>
      </form>

      <div *ngIf="inviteUrl" class="invite-url-banner">
        <div class="banner-header">
          <h4>✉️ Invitation Sent!</h4>
          <button type="button" (click)="clearInviteUrl()" class="btn-close">×</button>
        </div>
        <p>Share this link with the invitee:</p>
        <div class="url-box">
          <code>{{ inviteUrl }}</code>
          <button type="button" (click)="copyInviteUrl()" class="btn-copy">
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </div>
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
          <div class="member-item" *ngFor="let member of vm.data.members">
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
              <!-- Future: Add remove/update role actions here -->
            </div>
          </div>
        </div>
      </ng-container>
    </section>

    <div class="info-box">
      <h4>ℹ️ Team Roles</h4>
      <ul>
        <li><strong>Owner:</strong> Full access, can manage billing and delete store</li>
        <li><strong>Admin:</strong> Can manage domains, invite members, and view all data</li>
        <li><strong>Member:</strong> Can view store data and manage assigned domains</li>
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

      .invite-url-banner {
        margin-top: 1.5rem;
        padding: 1.5rem;
        border-radius: 12px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid #10b981;
      }

      .banner-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 1rem;
      }

      .banner-header h4 {
        margin: 0;
        color: #10b981;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--muted);
        padding: 0;
        line-height: 1;
      }

      .invite-url-banner p {
        margin: 0 0 0.75rem 0;
        color: var(--foreground);
      }

      .url-box {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        padding: 0.75rem;
        border-radius: 8px;
        background: var(--card);
        border: 1px solid var(--border);
      }

      .url-box code {
        flex: 1;
        font-size: 0.85rem;
        word-break: break-all;
        color: var(--foreground);
      }

      .btn-copy {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        white-space: nowrap;
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

      .badge-0,
      .badge-pending {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
      }

      .badge-1,
      .badge-active {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .badge-2,
      .badge-revoked {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .badge-3,
      .badge-expired {
        background: rgba(156, 163, 175, 0.2);
        color: #9ca3af;
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
  private readonly membershipsFacade = inject(MembershipsFacade);
  private readonly fb = inject(FormBuilder);

  readonly vm$ = this.membershipsFacade.vm$;
  readonly MembershipRole = MembershipRole;

  isSending = false;
  errorMessage: string | null = null;
  inviteUrl: string | null = null;
  copied = false;

  readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: [MembershipRole.Member, Validators.required],
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
    this.inviteUrl = null;

    this.membershipsFacade
      .sendInvitation(email, role)
      .pipe(
        take(1),
        finalize(() => (this.isSending = false))
      )
      .subscribe({
        next: (url) => {
          this.inviteUrl = url;
          this.inviteForm.reset({ email: '', role: MembershipRole.Member });
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to send invitation. Please try again.';
        },
      });
  }

  copyInviteUrl(): void {
    if (!this.inviteUrl) return;

    navigator.clipboard.writeText(this.inviteUrl).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  clearInviteUrl(): void {
    this.inviteUrl = null;
    this.membershipsFacade.clearInviteUrl();
  }
}

