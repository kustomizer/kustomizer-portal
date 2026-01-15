import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { PortalStoreFacade } from '../../../core/facades/portal-store.facade';
import { StoreDomain } from '../../../core/models';
import { domainValidator, normalizeDomain } from '../../../shared/validators/domain.validator';

@Component({
  selector: 'app-store-domains',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>Allowlisted domains</h2>
        <p>Control which domains can access your storefront experience.</p>
      </div>
      <a class="ghost" [routerLink]="['/app/stores', storeId]">Back to store</a>
    </div>

    <div class="card" *ngIf="license$ | async as licenseState">
      <div *ngIf="licenseState.state === 'loading'" class="state">Loading license limits...</div>
      <div *ngIf="licenseState.state === 'error'" class="state error">{{ licenseState.error }}</div>
      <div *ngIf="licenseState.state === 'empty'" class="state">No license data found.</div>
      <div *ngIf="licenseState.state === 'ready'" class="limits">
        <div>
          <p class="label">Current tier</p>
          <p>{{ licenseState.data?.tier | titlecase }}</p>
        </div>
        <div>
          <p class="label">Domains per store</p>
          <p>{{ licenseState.data?.limits?.domainsPerStore }}</p>
        </div>
        <div>
          <p class="label">Domains used</p>
          <p>{{ domainCount }}</p>
        </div>
      </div>
    </div>

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
        margin-bottom: 1.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 1.25rem;
        margin-bottom: 1rem;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .state {
        color: var(--muted);
      }

      .state.error {
        color: var(--danger);
      }

      .limits {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .label {
        text-transform: uppercase;
        font-size: 0.7rem;
        color: var(--muted);
        letter-spacing: 0.15em;
      }

      .form {
        display: grid;
        gap: 1rem;
        align-items: end;
        grid-template-columns: 1fr 160px;
      }

      input {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        padding: 0.6rem 0.8rem;
        color: var(--foreground);
      }

      button {
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        cursor: pointer;
        padding: 0.7rem 1rem;
      }

      button.ghost {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--foreground);
      }

      .ghost {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.55rem 0.9rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        color: var(--foreground);
      }

      .helper {
        color: var(--muted);
        font-size: 0.8rem;
        margin-top: 0.35rem;
      }

      .helper.error {
        color: var(--danger);
      }

      .list {
        display: grid;
        gap: 0.75rem;
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

      @media (max-width: 700px) {
        .form {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class StoreDomainsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PortalStoreFacade);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private domainsCache: StoreDomain[] = [];
  storeId = '';
  domainCount = 0;

  readonly license$ = this.facade.license$;
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
        this.domainCount = state.data.length;
      } else if (state.state === 'empty') {
        this.domainsCache = [];
        this.domainCount = 0;
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
