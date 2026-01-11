import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PortalDashboardFacade } from '../../../core/facades/portal-dashboard.facade';
import { License, MembershipRole } from '../../../core/models';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="grid">
      <section class="card">
        <h3>License overview</h3>
        <ng-container *ngIf="license$ | async as licenseState">
          <div *ngIf="licenseState.state === 'loading'" class="state">Loading license...</div>
          <div *ngIf="licenseState.state === 'error'" class="state error">{{ licenseState.error }}</div>
          <div *ngIf="licenseState.state === 'empty'" class="state">No license assigned yet.</div>
          <div *ngIf="licenseState.state === 'ready'" class="license">
            <div>
              <p class="label">Status</p>
              <h2>{{ licenseState.data?.status | titlecase }}</h2>
              <p class="sub" *ngIf="licenseState.data">{{ licenseMessage(licenseState.data) }}</p>
            </div>
            <div>
              <p class="label">Tier</p>
              <h2>{{ licenseState.data?.tier | titlecase }}</h2>
              <p class="sub">Expires {{ licenseState.data?.expiresAt | date: 'mediumDate' }}</p>
            </div>
            <div>
              <p class="label">Limits</p>
              <p class="sub">Stores: {{ licenseState.data?.limits?.stores }}</p>
              <p class="sub">Domains/store: {{ licenseState.data?.limits?.domainsPerStore }}</p>
              <p class="sub">Seats: {{ licenseState.data?.limits?.seats }}</p>
            </div>
            <a class="cta" routerLink="/app/tier">Change tier</a>
          </div>
        </ng-container>
      </section>

      <section class="card">
        <h3>Connected stores</h3>
        <ng-container *ngIf="stores$ | async as storesState">
          <div *ngIf="storesState.state === 'loading'" class="state">Loading stores...</div>
          <div *ngIf="storesState.state === 'error'" class="state error">{{ storesState.error }}</div>
          <div *ngIf="storesState.state === 'empty'" class="state">No stores connected yet.</div>
          <div *ngIf="storesState.state === 'ready'" class="store-list">
            <a
              class="store"
              *ngFor="let store of storesState.data ?? []"
              [routerLink]="['/app/stores', store.id]"
            >
              <div>
                <h4>{{ store.shopDomain }}</h4>
                <p>{{ store.metadata?.shopName || 'Shopify store' }}</p>
              </div>
              <span [class.error]="store.status === 'error'">
                {{ facade.storeStatusLabel(store) }}
              </span>
            </a>
          </div>
        </ng-container>
      </section>

      <section class="card">
        <h3>Team & invitations</h3>
        <div class="invite-form" [formGroup]="inviteForm">
          <input formControlName="email" placeholder="Invite email" />
          <select formControlName="role">
            <option value="member">Member</option>
            <option value="owner">Owner</option>
          </select>
          <button type="button" (click)="invite()" [disabled]="inviteForm.invalid || inviting">
            {{ inviting ? 'Sending...' : 'Invite' }}
          </button>
        </div>

        <ng-container *ngIf="invitations$ | async as invitesState">
          <div *ngIf="invitesState.state === 'loading'" class="state">Loading invites...</div>
          <div *ngIf="invitesState.state === 'error'" class="state error">{{ invitesState.error }}</div>
          <div *ngIf="invitesState.state === 'empty'" class="state">No pending invitations.</div>
          <div *ngIf="invitesState.state === 'ready'" class="list">
            <div class="list-item" *ngFor="let invite of invitesState.data ?? []">
              <div>
                <strong>{{ invite.email }}</strong>
                <p>{{ invite.role | titlecase }} · {{ invite.status | titlecase }}</p>
              </div>
              <button type="button" (click)="accept(invite.id)">Accept</button>
            </div>
          </div>
        </ng-container>

        <ng-container *ngIf="members$ | async as membersState">
          <div *ngIf="membersState.state === 'loading'" class="state">Loading members...</div>
          <div *ngIf="membersState.state === 'error'" class="state error">{{ membersState.error }}</div>
          <div *ngIf="membersState.state === 'empty'" class="state">No members yet.</div>
          <div *ngIf="membersState.state === 'ready'" class="list">
            <div class="list-item" *ngFor="let member of membersState.data ?? []">
              <div>
                <strong>{{ member.user?.name || member.userId }}</strong>
                <p>{{ member.user?.email || 'unknown' }} · {{ member.role | titlecase }}</p>
              </div>
              <span>{{ member.createdAt | date: 'mediumDate' }}</span>
            </div>
          </div>
        </ng-container>
      </section>
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: var(--shadow-soft);
      }

      .state {
        color: var(--muted);
        padding: 0.75rem 0;
      }

      .state.error {
        color: var(--danger);
      }

      .license {
        display: grid;
        gap: 1rem;
      }

      .label {
        text-transform: uppercase;
        font-size: 0.7rem;
        color: var(--muted);
        letter-spacing: 0.15em;
      }

      .sub {
        color: var(--muted);
        margin: 0;
      }

      .cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem 1rem;
        border-radius: 12px;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        width: fit-content;
      }

      .store-list {
        display: grid;
        gap: 0.75rem;
      }

      .store {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 16px;
        background: var(--card-soft);
        border: 1px solid transparent;
        transition: border-color 0.2s ease;
      }

      .store:hover {
        border-color: var(--primary);
      }

      .store span {
        font-size: 0.8rem;
        color: var(--muted);
      }

      .store span.error {
        color: var(--danger);
      }

      .invite-form {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
        align-items: stretch;
      }

      input,
      select {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        padding: 0.5rem 0.75rem;
        color: var(--foreground);
      }

      button {
        width: 100%;
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        cursor: pointer;
      }

      .list {
        display: grid;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 0.8rem;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
      }

      @media (max-width: 720px) {
        .invite-form {
          width: 100%;
        }
      }
    `,
  ],
})
export class PortalDashboardComponent {
  readonly facade = inject(PortalDashboardFacade);
  private readonly formBuilder = inject(FormBuilder);

  readonly license$ = this.facade.license$;
  readonly stores$ = this.facade.stores$;
  readonly invitations$ = this.facade.invitations$;
  readonly members$ = this.facade.members$;

  inviting = false;

  readonly inviteForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['member' as MembershipRole, Validators.required],
  });

  invite(): void {
    if (this.inviteForm.invalid) {
      return;
    }
    const { email, role } = this.inviteForm.getRawValue();
    if (!email || !role) {
      return;
    }
    this.inviting = true;
    this.facade
      .inviteMember(email, role as MembershipRole)
      .pipe(finalize(() => (this.inviting = false)))
      .subscribe(() => {
        this.inviteForm.reset({ email: '', role: 'member' });
        this.facade.refresh();
      });
  }

  accept(invitationId: string): void {
    this.facade.acceptInvitation(invitationId).subscribe(() => this.facade.refresh());
  }

  licenseMessage(license: License): string {
    if (license.status === 'trial' && license.expiresAt) {
      const days = this.daysUntil(license.expiresAt);
      return `Trial ends in ${days} day${days === 1 ? '' : 's'}`;
    }
    if (license.status === 'expired') {
      return 'Your license is expired. Please upgrade.';
    }
    return 'Your plan is active.';
  }

  private daysUntil(date: string): number {
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
