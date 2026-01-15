import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DomainsFacade } from '../../../core/facades/domains.facade';
import { DomainError } from '../../../core/types/domain-error';

@Component({
  selector: 'app-store-domains',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>Domain Management</h2>
        <p>Add and remove domains for this store</p>
      </div>
      <a [routerLink]="['/app/stores', storeId]" class="btn-secondary">← Back to Store</a>
    </div>

    <section class="card">
      <h3>Add Domain</h3>
      <form [formGroup]="domainForm" (ngSubmit)="addDomain()" class="domain-form">
        <div class="input-group">
          <input
            type="text"
            formControlName="domain"
            placeholder="example.com"
            [disabled]="isSubmitting"
          />
          <button type="submit" [disabled]="domainForm.invalid || isSubmitting" class="btn-primary">
            {{ isSubmitting ? 'Adding...' : 'Add Domain' }}
          </button>
        </div>
        <div
          *ngIf="domainForm.get('domain')?.invalid && domainForm.get('domain')?.touched"
          class="error-msg"
        >
          Please enter a valid domain
        </div>
        <div *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</div>
        <div *ngIf="successMessage" class="success-msg">{{ successMessage }}</div>
      </form>
    </section>

    <section class="card">
      <div class="card-header">
        <h3>Domains</h3>
        <ng-container *ngIf="vm$ | async as vm">
          <span class="count" *ngIf="vm.state === 'ready' && vm.data">
            {{ vm.data.domains.length }} / {{ vm.data.maxDomains }}
          </span>
        </ng-container>
      </div>

      <ng-container *ngIf="vm$ | async as vm">
        <div *ngIf="vm.state === 'loading'" class="state">Loading domains...</div>
        <div *ngIf="vm.state === 'error'" class="state error">{{ vm.error }}</div>
        <div *ngIf="vm.state === 'empty'" class="state">
          No domains added yet. Add your first domain above.
        </div>
        <div *ngIf="vm.state === 'ready' && vm.data" class="domains-list">
          <div *ngIf="vm.data.limitReached" class="warning-msg">
            Domain limit reached. Remove a domain or upgrade your plan to add more.
          </div>
          <div class="domain-item" *ngFor="let domain of vm.data.domains">
            <div class="domain-info">
              <h4>{{ domain.domain }}</h4>
              <p class="muted">Added {{ domain.createdAt | date: 'medium' }}</p>
            </div>
            <button
              type="button"
              (click)="removeDomain(domain.id, domain.domain)"
              class="btn-danger"
              [disabled]="isRemoving === domain.id"
            >
              {{ isRemoving === domain.id ? 'Removing...' : 'Remove' }}
            </button>
          </div>
        </div>
      </ng-container>
    </section>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }

      .btn-secondary {
        padding: 0.5rem 1rem;
        border-radius: 10px;
        background: var(--card);
        border: 1px solid var(--border);
        color: var(--foreground);
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-secondary:hover {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.1);
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .card h3 {
        margin: 0 0 1rem 0;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .card-header h3 {
        margin: 0;
      }

      .count {
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: var(--card-soft);
        border: 1px solid var(--border);
        font-size: 0.85rem;
        font-weight: 600;
      }

      .domain-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .input-group {
        display: flex;
        gap: 0.75rem;
      }

      input {
        flex: 1;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--foreground);
        font-size: 1rem;
      }

      input:focus {
        outline: none;
        border-color: var(--primary);
      }

      input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-primary {
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: opacity 0.2s;
        white-space: nowrap;
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

      .warning-msg {
        padding: 1rem;
        border-radius: 12px;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid #fbbf24;
        color: #fbbf24;
        margin-bottom: 1rem;
      }

      .state {
        color: var(--muted);
        padding: 2rem 0;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
      }

      .domains-list {
        display: grid;
        gap: 0.75rem;
      }

      .domain-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: 14px;
        background: var(--card-soft);
        border: 1px solid var(--border);
      }

      .domain-info h4 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
      }

      .muted {
        color: var(--muted);
        font-size: 0.85rem;
        margin: 0;
      }

      .btn-danger {
        padding: 0.5rem 1rem;
        border-radius: 10px;
        border: 1px solid #ef4444;
        background: transparent;
        color: #ef4444;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .btn-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.1);
      }

      .btn-danger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      @media (max-width: 640px) {
        .input-group {
          flex-direction: column;
        }

        .domain-item {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class StoreDomainsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly domainsFacade = inject(DomainsFacade);
  private readonly fb = inject(FormBuilder);

  readonly vm$ = this.domainsFacade.vm$;
  readonly storeId = this.route.snapshot.params['storeId'];

  isSubmitting = false;
  isRemoving: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly domainForm = this.fb.nonNullable.group({
    domain: ['', [Validators.required, Validators.pattern(/^[a-z0-9.-]+\.[a-z]{2,}$/)]],
  });

  addDomain(): void {
    if (this.domainForm.invalid) {
      return;
    }

    const domain = this.domainForm.value.domain;
    if (!domain) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.domainsFacade
      .addDomain(domain)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.successMessage = `Domain "${domain}" added successfully`;
          this.domainForm.reset();
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: (error: DomainError) => {
          if (error.type === 'Conflict' && error.reason === 'DOMAIN_LIMIT_REACHED') {
            this.errorMessage = 'Domain limit reached. Remove a domain or upgrade your plan.';
          } else if (error.type === 'Conflict') {
            this.errorMessage = 'This domain already exists.';
          } else if (error.type === 'Validation') {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Failed to add domain. Please try again.';
          }
        },
      });
  }

  removeDomain(domainId: string, domainName: string): void {
    if (!confirm(`Are you sure you want to remove "${domainName}"?`)) {
      return;
    }

    this.isRemoving = domainId;
    this.errorMessage = null;

    this.domainsFacade
      .removeDomain(domainId)
      .pipe(finalize(() => (this.isRemoving = null)))
      .subscribe({
        next: () => {
          this.successMessage = `Domain "${domainName}" removed successfully`;
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: () => {
          this.errorMessage = 'Failed to remove domain. Please try again.';
        },
      });
  }
}
