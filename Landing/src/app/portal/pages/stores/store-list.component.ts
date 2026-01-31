import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EMPTY } from 'rxjs';
import { finalize, take, switchMap, map, catchError } from 'rxjs/operators';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';
import { LicenseFacade } from '../../../core/facades/license.facade';
import { Tier } from '../../../core/types/enums';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="header">
      <div>
        <h2>Stores</h2>
        <p>Manage your stores and view details.</p>
      </div>
    </div>

    <section class="card create-store">
      <h3>Create New Store</h3>
      <form [formGroup]="createForm" (ngSubmit)="createStore()" class="create-form">
        <div class="form-row">
          <div class="form-group">
            <label for="storeName">Store Name</label>
            <input
              id="storeName"
              type="text"
              formControlName="storeName"
              placeholder="My New Store"
              [disabled]="isCreating"
            />
            <div *ngIf="createForm.get('storeName')?.invalid && createForm.get('storeName')?.touched" class="error-msg">
              Store name is required
            </div>
          </div>

          <div class="form-group">
            <label for="domain">Store Domain</label>
            <input
              id="domain"
              type="text"
              formControlName="domain"
              placeholder="store.example.com"
              [disabled]="isCreating"
            />
            <div *ngIf="createForm.get('domain')?.invalid && createForm.get('domain')?.touched" class="error-msg">
              Domain is required
            </div>
          </div>

          <div class="form-group" *ngIf="!(hasLicense$ | async)">
            <label for="tier">Plan (first store)</label>
            <select id="tier" formControlName="tier" [disabled]="isCreating">
              <option [value]="Tier.Starter">Starter</option>
              <option [value]="Tier.Growth">Growth</option>
              <option [value]="Tier.Enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <button type="submit" class="btn-primary" [disabled]="createForm.invalid || isCreating">
          {{ isCreating ? 'Creating...' : 'Create Store' }}
        </button>

        <div *ngIf="createError" class="error-msg">{{ createError }}</div>
        <div *ngIf="createSuccess" class="success-msg">{{ createSuccess }}</div>
      </form>
    </section>

    <ng-container *ngIf="vm$ | async as vm">
      <div *ngIf="vm.state === 'loading'" class="state">Loading stores...</div>
      <div *ngIf="vm.state === 'error'" class="state error">{{ vm.error }}</div>
      <div *ngIf="vm.state === 'empty'" class="state">No stores found. Create one above.</div>
      <div *ngIf="vm.state === 'ready' && vm.data" class="grid">
        <div
          class="card"
          *ngFor="let store of vm.data.stores"
          [class.active]="store.id === vm.data.activeStore?.id"
        >
          <div class="store-header">
            <h3>{{ store.name }}</h3>
            <span class="badge" *ngIf="store.id === vm.data.activeStore?.id">Active</span>
          </div>
          <div class="meta">
            <p class="muted">{{ store.domain }}</p>
            <p class="muted">Created {{ store.createdAt | date: 'mediumDate' }}</p>
          </div>
          <div class="actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="setActiveStore(store.id)"
              [disabled]="store.id === vm.data.activeStore?.id"
            >
              {{ store.id === vm.data.activeStore?.id ? 'Current Active Store' : 'Set Active' }}
            </button>
            <a [routerLink]="['/app/stores', store.id]" class="btn-link">View Details →</a>
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

      .create-store {
        margin-bottom: 1.5rem;
      }

      .create-form {
        display: grid;
        gap: 1rem;
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
        justify-self: start;
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

      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.5rem;
        border-radius: 18px;
        border: 2px solid var(--border);
        background: var(--card);
        transition: all 0.2s ease;
      }

      .card:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
        box-shadow: var(--shadow-soft);
      }

      .card.active {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.05);
      }

      .store-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
      }

      .store-header h3 {
        margin: 0;
      }

      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: var(--primary);
        color: #0a0d10;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }

      .btn-secondary {
        padding: 0.45rem 0.9rem;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--foreground);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-secondary:hover:not(:disabled) {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.1);
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-link {
        color: var(--primary);
        font-weight: 600;
      }

      .muted {
        color: var(--muted);
        font-size: 0.85rem;
        margin: 0;
      }
    `,
  ],
})
export class StoreListComponent {
  private readonly storeContext = inject(StoreContextFacade);
  private readonly licenseFacade = inject(LicenseFacade);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly vm$ = this.storeContext.vm$;
  readonly Tier = Tier;
  readonly hasLicense$ = this.licenseFacade.vm$.pipe(
    map((vm) => vm.state === 'ready' && !!vm.data?.license)
  );

  isCreating = false;
  createError: string | null = null;
  createSuccess: string | null = null;

  readonly createForm = this.fb.nonNullable.group({
    storeName: ['', [Validators.required]],
    domain: ['', [Validators.required]],
    tier: [Tier.Starter, [Validators.required]],
  });

  createStore(): void {
    if (this.createForm.invalid) {
      return;
    }

    const { storeName, domain, tier } = this.createForm.getRawValue();
    this.isCreating = true;
    this.createError = null;
    this.createSuccess = null;

    this.licenseFacade.vm$
      .pipe(
        take(1),
        switchMap((licenseVm) => {
          const resolvedTier =
            licenseVm.state === 'ready' && licenseVm.data?.license
              ? licenseVm.data.license.tier
              : tier;
          return this.storeContext.bootstrapStore(storeName, domain, resolvedTier);
        }),
        catchError((error) => {
          this.createError = error instanceof Error ? error.message : 'Failed to create store. Please try again.';
          this.cdr.detectChanges();
          return EMPTY;
        }),
        finalize(() => {
          this.isCreating = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.createSuccess = 'Store created successfully.';
          this.createForm.reset({ storeName: '', domain: '', tier: Tier.Starter });
          this.cdr.detectChanges();
          setTimeout(() => (this.createSuccess = null), 3000);
        },
      });
  }

  setActiveStore(storeId: string): void {
    this.storeContext.setActiveStore(storeId);
  }
}
