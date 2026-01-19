import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, take } from 'rxjs/operators';
import { AdminFacade } from '../../../core/facades/admin.facade';
import { StoreUserRole, StoreUserStatus, Tier } from '../../../core/types/enums';

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
              <label>Domain</label>
              <p><code>{{ detailState.data.store.domain }}</code></p>
            </div>
            <div class="info-item">
              <label>Owner Email</label>
              <p>{{ detailState.data.store.ownerEmail }}</p>
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
            <span
              class="badge"
              [class]="detailState.data.license?.active ? 'badge-status-active' : 'badge-status-expired'"
            >
              {{ detailState.data.licenseStatusLabel }}
            </span>
          </div>

          <form [formGroup]="licenseForm" (ngSubmit)="updateLicense()" class="license-form">
            <div class="form-row">
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

            <div *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</div>
            <div *ngIf="successMessage" class="success-msg">{{ successMessage }}</div>

            <button type="submit" class="btn-primary" [disabled]="licenseForm.invalid || isUpdating">
              {{ isUpdating ? 'Updating...' : 'Update License' }}
            </button>
          </form>
        </section>

        <!-- Team Members -->
        <section class="card">
          <h3>Store Users ({{ detailState.data.storeUsers.length }})</h3>
          <div *ngIf="detailState.data.storeUsers.length === 0" class="state">
            No team members yet
          </div>
          <div *ngIf="detailState.data.storeUsers.length > 0" class="members-list">
            <div class="member-item" *ngFor="let member of detailState.data.storeUsers">
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

      .badge-status-active {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .badge-status-expired {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
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
  readonly Tier = Tier;
  readonly StoreUserRole = StoreUserRole;
  readonly StoreUserStatus = StoreUserStatus;

  isUpdating = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly licenseForm = this.fb.nonNullable.group({
    tier: [Tier.Starter, Validators.required],
    expiresAt: [''],
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
            tier: license.tier,
            expiresAt: license.expiresAt
              ? this.formatDateTimeLocal(license.expiresAt)
              : '',
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
        tier: formValue.tier!,
        expiresAt: formValue.expiresAt || null,
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

  getRoleLabel(role: StoreUserRole): string {
    if (role === StoreUserRole.Owner) return 'Owner';
    if (role === StoreUserRole.Admin) return 'Admin';
    if (role === StoreUserRole.Reader) return 'Read-only';
    return 'Unknown';
  }

  getStatusLabel(status: StoreUserStatus): string {
    if (status === StoreUserStatus.Active) return 'Active';
    if (status === StoreUserStatus.Pending) return 'Pending';
    if (status === StoreUserStatus.Removed) return 'Removed';
    return 'Unknown';
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
