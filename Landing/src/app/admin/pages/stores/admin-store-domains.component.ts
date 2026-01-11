import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { AdminStoreDomainsFacade } from '../../../core/facades/admin-store-domains.facade';
import { StoreDomain } from '../../../core/models';
import { domainValidator, normalizeDomain } from '../../../shared/validators/domain.validator';

@Component({
  selector: 'app-admin-store-domains',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <ng-container *ngIf="storeState$ | async as storeState">
      <div *ngIf="storeState.state === 'loading'" class="state">Loading store...</div>
      <div *ngIf="storeState.state === 'error'" class="state error">{{ storeState.error }}</div>
      <div *ngIf="storeState.state === 'empty'" class="state">Store not found.</div>
      <div *ngIf="storeState.state === 'ready'" class="header">
        <div>
          <h2>{{ storeState.data?.shopDomain }}</h2>
          <p>{{ storeState.data?.metadata?.shopName || 'Shopify store' }}</p>
        </div>
        <a routerLink="/admin/orgs" class="ghost">Back to orgs</a>
      </div>
    </ng-container>

    <form class="card form" [formGroup]="domainForm" (ngSubmit)="addDomain()">
      <div>
        <label>Domain</label>
        <input formControlName="domain" placeholder="shop.brand.com" />
        <p class="helper" *ngIf="domainForm.controls.domain.errors?.['domain']">
          Please enter a valid domain.
        </p>
      </div>
      <button type="submit" [disabled]="domainForm.invalid || submitting">
        {{ submitting ? 'Adding...' : 'Add domain' }}
      </button>
      <p class="helper error" *ngIf="errorMessage">{{ errorMessage }}</p>
    </form>

    <ng-container *ngIf="domainsState$ | async as domainsState">
      <div *ngIf="domainsState.state === 'loading'" class="state">Loading domains...</div>
      <div *ngIf="domainsState.state === 'error'" class="state error">{{ domainsState.error }}</div>
      <div *ngIf="domainsState.state === 'empty'" class="state">No domains added yet.</div>
      <div *ngIf="domainsState.state === 'ready'" class="card list">
        <div class="list-item" *ngFor="let domain of domainsState.data ?? []">
          <div>
            <strong>{{ domain.domain }}</strong>
            <p>Added {{ domain.createdAt | date: 'mediumDate' }}</p>
          </div>
          <button type="button" class="ghost" (click)="removeDomain(domain)">Remove</button>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.25rem;
        margin-bottom: 1rem;
      }

      .form {
        display: grid;
        gap: 1rem;
        align-items: end;
        grid-template-columns: 1fr 160px;
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
        padding: 0.6rem 0.8rem;
        color: var(--foreground);
      }

      button,
      .ghost {
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        cursor: pointer;
        padding: 0.7rem 1rem;
        text-align: center;
      }

      .ghost {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--foreground);
      }

      .list {
        display: grid;
        gap: 0.75rem;
        width: 100%;
      }

      .list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 0.8rem;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        width: 100%;
        box-sizing: border-box;
      }

      .state {
        color: var(--muted);
      }

      .state.error {
        color: var(--danger);
      }

      .helper {
        color: var(--muted);
        font-size: 0.8rem;
        margin-top: 0.35rem;
      }

      .helper.error {
        color: var(--danger);
      }

      @media (max-width: 700px) {
        .form {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminStoreDomainsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(AdminStoreDomainsFacade);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private domainsCache: StoreDomain[] = [];
  private storeId = '';

  readonly storeState$ = this.route.paramMap.pipe(
    map(params => params.get('storeId') ?? ''),
    switchMap(storeId => this.facade.store(storeId))
  );

  readonly domainsState$ = this.route.paramMap.pipe(
    map(params => params.get('storeId') ?? ''),
    switchMap(storeId => {
      this.storeId = storeId;
      return this.facade.domains(storeId);
    }),
    shareReplay(1)
  );

  readonly domainForm = this.formBuilder.group({
    domain: ['', [Validators.required, domainValidator]],
  });

  submitting = false;
  errorMessage = '';

  constructor() {
    this.domainsState$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      if (state.state === 'ready' && state.data) {
        this.domainsCache = state.data;
      } else if (state.state === 'empty') {
        this.domainsCache = [];
      }
    });
  }

  addDomain(): void {
    if (this.domainForm.invalid || !this.storeId) {
      return;
    }
    this.errorMessage = '';
    const raw = this.domainForm.getRawValue().domain ?? '';
    const normalized = normalizeDomain(raw);

    if (this.domainsCache.some(domain => domain.domain === normalized)) {
      this.errorMessage = 'This domain is already allowlisted.';
      return;
    }

    this.submitting = true;
    this.facade.addDomain(this.storeId, normalized).subscribe({
      next: () => {
        this.domainForm.reset({ domain: '' });
        this.submitting = false;
      },
      error: error => {
        this.errorMessage = error instanceof Error ? error.message : 'Unable to add domain.';
        this.submitting = false;
      },
    });
  }

  removeDomain(domain: StoreDomain): void {
    if (!confirm(`Remove ${domain.domain} from allowlist?`)) {
      return;
    }
    this.facade.removeDomain(domain.id).subscribe();
  }
}
