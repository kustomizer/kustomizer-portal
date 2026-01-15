import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, take } from 'rxjs/operators';
import { AdminFacade } from '../../../core/facades/admin.facade';
import { LicenseStatus, Tier } from '../../../core/types/enums';

@Component({
  selector: 'app-admin-store-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>Store Management</h2>
        <p>View and manage store details and license</p>
      </div>
      <a routerLink="/admin/stores" class="btn-secondary">← Back to All Stores</a>
    </div>

    <ng-container *ngIf="detail$ | async as detailState">
      <div *ngIf="detailState.state === 'loading'" class="state">Loading store details...</div>
      <div *ngIf="detailState.state === 'error'" class="state error">{{ detailState.error }}</div>

      <div *ngIf="detailState.state === 'ready' && detailState.data" class="content">
        <!-- Store Information -->
        <section class="card">
          <h3>Store Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Store Name</label>
              <p>{{ detailState.data.store.name }}</p>
            </div>
            <div class="info-item">
              <label>Store ID</label>
              <p><code>{{ detailState.data.store.id }}</code></p>
            </div>
            <div class="info-item">
              <label>Created</label>
              <p>{{ detailState.data.store.createdAt | date: 'medium' }}</p>
            </div>
          </div>
        </section>

        <!-- License Management -->
        <section class="card" *ngIf="detailState.data.license">
          <div class="card-header">
            <h3>License Management</h3>
            <span class="badge" [class]="'badge-status-' + detailState.data.license.status">
              {{ detailState.data.licenseStatusLabel }}
            </span>
          </div>

          <form [formGroup]="licenseForm" (ngSubmit)="updateLicense()" class="license-form">
            <div class="form-row">
              <div class="form-group">
                <label for="status">Status</label>
                <select id="status" formControlName="status">
                  <option [value]="LicenseStatus.Trial">Trial</option>
                  <option [value]="LicenseStatus.Active">Active</option>
                  <option [value]="LicenseStatus.Expired">Expired</option>
                  <option [value]="LicenseStatus.Suspended">Suspended</option>
                </select>
              </div>

              <div class="form-group">
                <label for="tier">Tier</label>
                <select id="tier" formControlName="tier">
                  <option [value]="Tier.Starter">Starter</option>
                  <option [value]="Tier.Growth">Growth</option>
                  <option [value]="Tier.Enterprise">Enterprise</option>
                </select>
              </div>

              <div class="form-group">
                <label for="expiresAt">Expires At</label>
                <input
                  id="expiresAt"
                  type="datetime-local"
                  formControlName="expiresAt"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="stores">Max Stores</label>
                <input
                  id="stores"
                  type="number"
                  formControlName="stores"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div class="form-group">
                <label for="domainsPerStore">Domains Per Store</label>
                <input
                  id="domainsPerStore"
                  type="number"
                  formControlName="domainsPerStore"
                  min="0"
                  placeholder="0"
                />
              </div>

              <div class="form-group">
                <label for="seats">Team Seats</label>
                <input
                  id="seats"
                  type="number"
                  formControlName="seats"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>

            <div *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</div>
            <div *ngIf="successMessage" class="success-msg">{{ successMessage }}</div>

            <button type="submit" class="btn-primary" [disabled]="licenseForm.invalid || isUpdating">
              {{ isUpdating ? 'Updating...' : 'Update License' }}
            </button>
          </form>
        </section>

        <!-- Team Members -->
        <section class="card">
          <h3>Team Members ({{ detailState.data.memberships.length }})</h3>
          <div *ngIf="detailState.data.memberships.length === 0" class="state">
            No team members yet
          </div>
          <div *ngIf="detailState.data.memberships.length > 0" class="members-list">
            <div class="member-item" *ngFor="let member of detailState.data.memberships">
              <div>
                <strong>{{ member.email }}</strong>
                <p class="muted">{{ getRoleLabel(member.role) }} • {{ getStatusLabel(member.status) }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .header p {
        color: var(--muted);
        margin-top: 0.5rem;
      }

      .btn-secondary {
        padding: 0.5rem 1rem;
        border-radius: 10px;
        background: var(--card);
        border: 1px solid var(--border);
        color: var(--foreground);
        font-weight: 500;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-secondary:hover {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.1);
      }

      .state {
        color: var(--muted);
        padding: 3rem 0;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
      }

      .content {
        display: grid;
        gap: 1.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 2rem;
      }

      .card h3 {
        margin: 0 0 1.5rem 0;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .card-header h3 {
        margin: 0;
      }

      .badge {
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .badge-status-0 {
        background: rgba(251, 191, 36, 0.2);
        color: #fbbf24;
      }

      .badge-status-1 {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .badge-status-2 {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      .badge-status-3 {
        background: rgba(249, 115, 22, 0.2);
        color: #f97316;
      }

      .info-grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .info-item label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
        font-weight: 600;
      }

      .info-item p {
        margin: 0;
        font-size: 1rem;
      }

      .info-item code {
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        background: var(--card-soft);
        color: var(--primary);
        font-size: 0.9rem;
      }

      .license-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-row {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

      .members-list {
        display: grid;
        gap: 0.75rem;
      }

      .member-item {
        padding: 1rem;
        border-radius: 12px;
        background: var(--card-soft);
        border: 1px solid var(--border);
      }

      .member-item strong {
        display: block;
        margin-bottom: 0.25rem;
      }

      .muted {
        color: var(--muted);
        font-size: 0.85rem;
        margin: 0;
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }

        .info-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminStoreDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminFacade = inject(AdminFacade);
  private readonly fb = inject(FormBuilder);

  readonly detail$ = this.adminFacade.selectedStoreDetail$;
  readonly LicenseStatus = LicenseStatus;
  readonly Tier = Tier;

  isUpdating = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly licenseForm = this.fb.nonNullable.group({
    status: [LicenseStatus.Active, Validators.required],
    tier: [Tier.Starter, Validators.required],
    expiresAt: [''],
    stores: [1, [Validators.required, Validators.min(0)]],
    domainsPerStore: [5, [Validators.required, Validators.min(0)]],
    seats: [3, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    const storeId = this.route.snapshot.params['storeId'];
    if (storeId) {
      this.adminFacade.selectStore(storeId);

      // Populate form when detail loads
      this.detail$.pipe(take(1)).subscribe((state) => {
        if (state.state === 'ready' && state.data?.license) {
          const license = state.data.license;
          this.licenseForm.patchValue({
            status: license.status,
            tier: license.tier,
            expiresAt: license.expiresAt
              ? this.formatDateTimeLocal(license.expiresAt)
              : '',
            stores: license.limits.stores || 1,
            domainsPerStore: license.limits.domainsPerStore || 5,
            seats: license.limits.seats || 3,
          });
        }
      });
    }
  }

  updateLicense(): void {
    if (this.licenseForm.invalid) {
      return;
    }

    const formValue = this.licenseForm.value;
    let licenseId = '';

    // Get license ID from current detail
    this.detail$.pipe(take(1)).subscribe((state) => {
      if (state.state === 'ready' && state.data?.license) {
        licenseId = state.data.license.id;
      }
    });

    if (!licenseId) {
      this.errorMessage = 'License ID not found';
      return;
    }

    this.isUpdating = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.adminFacade
      .updateLicense(licenseId, {
        status: formValue.status!,
        tier: formValue.tier!,
        expiresAt: formValue.expiresAt || undefined,
        limits: {
          stores: formValue.stores || 0,
          domainsPerStore: formValue.domainsPerStore || 0,
          seats: formValue.seats || 0,
        },
      })
      .pipe(
        take(1),
        finalize(() => (this.isUpdating = false))
      )
      .subscribe({
        next: () => {
          this.successMessage = 'License updated successfully!';
          setTimeout(() => (this.successMessage = null), 5000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to update license. Please try again.';
        },
      });
  }

  getRoleLabel(role: number): string {
    const roles = ['Owner', 'Admin', 'Member'];
    return roles[role] || 'Unknown';
  }

  getStatusLabel(status: number): string {
    const statuses = ['Pending', 'Active', 'Revoked', 'Expired'];
    return statuses[status] || 'Unknown';
  }

  private formatDateTimeLocal(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}

