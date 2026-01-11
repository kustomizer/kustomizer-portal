import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AdminLicensesFacade } from '../../../core/facades/admin-licenses.facade';
import { License } from '../../../core/models';

@Component({
  selector: 'app-admin-licenses',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <div>
        <h2>Licenses</h2>
        <p>Adjust tier, status, and limits for each organization.</p>
      </div>
    </div>

    <ng-container *ngIf="licenses$ | async as licensesState">
      <div *ngIf="licensesState.state === 'loading'" class="state">Loading licenses...</div>
      <div *ngIf="licensesState.state === 'error'" class="state error">{{ licensesState.error }}</div>
      <div *ngIf="licensesState.state === 'empty'" class="state">No licenses found.</div>
      <div *ngIf="licensesState.state === 'ready'" class="grid">
        <div class="card" *ngFor="let license of licensesState.data ?? []">
          <div class="title">
            <h3>{{ license.orgId }}</h3>
            <span class="pill">{{ license.status | titlecase }}</span>
          </div>
          <div class="fields">
            <label>Status
              <select [value]="license.status" (change)="updateStatus(license, $event)">
                <option value="trial">Trial</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </label>
            <label>Tier
              <select [value]="license.tier" (change)="updateTier(license, $event)">
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
            <label>Expires
              <input
                type="date"
                [value]="license.expiresAt ? (license.expiresAt | date: 'yyyy-MM-dd') : ''"
                (change)="updateExpiry(license, $event)"
              />
            </label>
          </div>
          <div class="limits">
            <label>Stores
              <input
                type="number"
                min="1"
                [value]="license.limits.stores"
                (change)="updateLimits(license, { stores: $any($event.target).value })"
              />
            </label>
            <label>Domains/store
              <input
                type="number"
                min="1"
                [value]="license.limits.domainsPerStore"
                (change)="updateLimits(license, { domainsPerStore: $any($event.target).value })"
              />
            </label>
            <label>Seats
              <input
                type="number"
                min="1"
                [value]="license.limits.seats"
                (change)="updateLimits(license, { seats: $any($event.target).value })"
              />
            </label>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .header {
        margin-bottom: 1.5rem;
      }

      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.25rem;
        display: grid;
        gap: 1rem;
      }

      .title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .pill {
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
      }

      .fields,
      .limits {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      }

      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: var(--muted);
      }

      select,
      input {
        width: 100%;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--foreground);
        padding: 0.45rem 0.6rem;
      }

      .state {
        color: var(--muted);
      }

      .state.error {
        color: var(--danger);
      }
    `,
  ],
})
export class AdminLicensesComponent {
  private readonly facade = inject(AdminLicensesFacade);

  readonly licenses$ = this.facade.licenses$;

  updateStatus(license: License, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as License['status'];
    this.facade.updateLicense(license.id, { status: value }).subscribe();
  }

  updateTier(license: License, event: Event): void {
    const value = (event.target as HTMLSelectElement).value as License['tier'];
    this.facade.updateLicense(license.id, { tier: value }).subscribe();
  }

  updateExpiry(license: License, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.facade.updateLicense(license.id, { expiresAt: value ? new Date(value).toISOString() : undefined }).subscribe();
  }

  updateLimits(
    license: License,
    changes: { stores?: string; domainsPerStore?: string; seats?: string }
  ): void {
    const parseValue = (value: string | undefined, fallback: number) => {
      if (value === undefined) {
        return fallback;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    };
    const parsed = {
      stores: parseValue(changes.stores, license.limits.stores),
      domainsPerStore: parseValue(changes.domainsPerStore, license.limits.domainsPerStore),
      seats: parseValue(changes.seats, license.limits.seats),
    };
    this.facade.updateLicense(license.id, { limits: { ...license.limits, ...parsed } }).subscribe();
  }
}
