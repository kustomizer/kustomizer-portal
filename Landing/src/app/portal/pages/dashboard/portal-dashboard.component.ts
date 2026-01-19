import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize, take } from 'rxjs/operators';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';
import { LicenseFacade } from '../../../core/facades/license.facade';
import { Tier } from '../../../core/types/enums';
import { getLicenseStatusClass } from '../../../shared/utils/enum-labels';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- Onboarding Form (shown when no stores exist) -->
    <ng-container *ngIf="storeContext$ | async as ctx">
      <div *ngIf="ctx.state === 'empty' && ctx.data?.needsBootstrap" class="onboarding-card">
        <div class="onboarding-header">
          <h2>Welcome to Kustomizer!</h2>
          <p>Let's set up your first store to get started</p>
        </div>

        <form [formGroup]="onboardingForm" (ngSubmit)="createStore()" class="onboarding-form">
          <div class="form-group">
            <label for="storeName">Store Name</label>
            <input
              id="storeName"
              type="text"
              formControlName="storeName"
              placeholder="My Awesome Store"
              [disabled]="bootstrapping"
            />
            <div *ngIf="onboardingForm.get('storeName')?.invalid && onboardingForm.get('storeName')?.touched" class="error-msg">
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
              [disabled]="bootstrapping"
            />
            <div *ngIf="onboardingForm.get('domain')?.invalid && onboardingForm.get('domain')?.touched" class="error-msg">
              Domain is required
            </div>
          </div>

          <div class="form-group">
            <label>Choose Your Tier</label>
            <div class="tier-cards">
              <label
                *ngFor="let tier of tiers"
                class="tier-card"
                [class.selected]="onboardingForm.get('tier')?.value === tier.value"
              >
                <input type="radio" formControlName="tier" [value]="tier.value" />
                <div class="tier-content">
                  <h4>{{ tier.label }}</h4>
                  <p class="tier-price">{{ tier.price }}</p>
                  <ul class="tier-features">
                    <li *ngFor="let feature of tier.features">{{ feature }}</li>
                  </ul>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="onboardingForm.invalid || bootstrapping">
            {{ bootstrapping ? 'Creating Store...' : 'Create Store' }}
          </button>

          <div *ngIf="bootstrapError" class="error-msg">
            {{ bootstrapError }}
          </div>
        </form>
      </div>
    </ng-container>

    <!-- Dashboard Content (shown after bootstrap) -->
    <div class="grid" *ngIf="!(storeContext$ | async)?.data?.needsBootstrap">
      <section class="card">
        <h3>License overview</h3>
        <ng-container *ngIf="licenseVm$ | async as licenseState">
          <div *ngIf="licenseState.state === 'loading'" class="state">Loading license...</div>
          <div *ngIf="licenseState.state === 'error'" class="state error">{{ licenseState.error }}</div>
          <div *ngIf="licenseState.state === 'empty'" class="state">No license assigned yet.</div>
          <div *ngIf="licenseState.state === 'ready' && licenseState.data" class="license">
            <div>
              <p class="label">Status</p>
              <h2 [class]="getLicenseStatusClass(licenseState.data.license?.active ?? false, licenseState.data.license?.expiresAt)">
                {{ licenseState.data.statusLabel }}
              </h2>
              <p class="sub">{{ licenseState.data.expiresIn }}</p>
            </div>
            <div>
              <p class="label">Tier</p>
              <h2>{{ licenseState.data.tierLabel }}</h2>
              <a class="link" routerLink="/app/tier">Change tier</a>
            </div>
          </div>
        </ng-container>
      </section>

      <section class="card">
        <h3>Quick Stats</h3>
        <ng-container *ngIf="storeContext$ | async as storeCtx">
          <div *ngIf="storeCtx.state === 'ready' && storeCtx.data" class="stats">
            <div class="stat">
              <p class="label">Active Store</p>
              <h3>{{ storeCtx.data.activeStore?.name || 'None' }}</h3>
            </div>
            <div class="stat">
              <p class="label">Total Stores</p>
              <h3>{{ storeCtx.data.stores.length }}</h3>
            </div>
          </div>
        </ng-container>
        
      </section>

      <section class="card">
        <h3>Quick Actions</h3>
        <div class="actions">
          <a routerLink="/app/stores" class="action-btn">
            <span>Manage Stores</span>
            <span class="arrow">→</span>
          </a>
          <a routerLink="/app/team" class="action-btn">
            <span>Invite Team Members</span>
            <span class="arrow">→</span>
          </a>
          <a routerLink="/app/tier" class="action-btn">
            <span>Upgrade Plan</span>
            <span class="arrow">→</span>
          </a>
          <a routerLink="/app/install" class="action-btn">
            <span>Installation Guide</span>
            <span class="arrow">→</span>
          </a>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .onboarding-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 24px;
        padding: 3rem 2rem;
        max-width: 900px;
        margin: 0 auto 2rem;
        box-shadow: var(--shadow-soft);
      }

      .onboarding-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .onboarding-header h2 {
        margin-bottom: 0.5rem;
      }

      .onboarding-header p {
        color: var(--muted);
      }

      .onboarding-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-weight: 600;
        font-size: 0.9rem;
      }

      .tier-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }

      .tier-card {
        position: relative;
        padding: 1.5rem;
        border: 2px solid var(--border);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s;
        background: var(--card-soft);
      }

      .tier-card:hover {
        border-color: var(--primary);
      }

      .tier-card.selected {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.1);
      }

      .tier-card input[type='radio'] {
        position: absolute;
        opacity: 0;
      }

      .tier-content h4 {
        margin: 0 0 0.5rem 0;
      }

      .tier-price {
        color: var(--primary);
        font-weight: 600;
        margin-bottom: 1rem;
      }

      .tier-features {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.85rem;
        color: var(--muted);
      }

      .tier-features li {
        padding: 0.25rem 0;
      }

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
        gap: 1.5rem;
      }

      .label {
        text-transform: uppercase;
        font-size: 0.7rem;
        color: var(--muted);
        letter-spacing: 0.15em;
        margin-bottom: 0.5rem;
      }

      .sub {
        color: var(--muted);
        margin: 0.25rem 0 0;
        font-size: 0.9rem;
      }

      .link {
        display: inline-block;
        margin-top: 0.5rem;
        color: var(--primary);
        font-size: 0.9rem;
        text-decoration: underline;
      }

      .stats {
        display: grid;
        gap: 1rem;
        margin-top: 1rem;
      }

      .stat h3 {
        margin: 0.5rem 0 0;
      }

      .actions {
        display: grid;
        gap: 0.75rem;
        margin-top: 1rem;
      }

      .action-btn {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-radius: 14px;
        background: var(--card-soft);
        border: 1px solid transparent;
        transition: all 0.2s;
        font-weight: 500;
      }

      .action-btn:hover {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.1);
      }

      .action-btn .arrow {
        color: var(--primary);
        font-size: 1.2rem;
      }

      input,
      select {
        width: 100%;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        padding: 0.75rem 1rem;
        color: var(--foreground);
        font-size: 1rem;
      }

      input:focus,
      select:focus {
        outline: none;
        border-color: var(--primary);
      }

      .btn-primary {
        width: 100%;
        padding: 1rem;
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: opacity 0.2s;
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
        margin-top: 0.25rem;
      }

      .status-trial {
        color: #fbbf24;
      }

      .status-active {
        color: #10b981;
      }

      .status-expired {
        color: #ef4444;
      }

      .status-warning {
        color: #f59e0b;
      }

      @media (max-width: 720px) {
        .onboarding-card {
          padding: 2rem 1.5rem;
        }

        .tier-cards {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PortalDashboardComponent {
  private readonly storeContextFacade = inject(StoreContextFacade);
  private readonly licenseFacade = inject(LicenseFacade);
  private readonly formBuilder = inject(FormBuilder);

  readonly storeContext$ = this.storeContextFacade.vm$;
  readonly licenseVm$ = this.licenseFacade.vm$;

  bootstrapping = false;
  bootstrapError: string | null = null;

  readonly tiers = [
    {
      value: Tier.Starter,
      label: 'Starter',
      price: '$29/mo',
      features: ['Single store', 'Core editor features', 'Email support'],
    },
    {
      value: Tier.Growth,
      label: 'Growth',
      price: '$99/mo',
      features: ['Multiple stores', 'Advanced editor features', 'Priority support'],
    },
    {
      value: Tier.Enterprise,
      label: 'Enterprise',
      price: 'Custom',
      features: [
        'Unlimited stores',
        'Dedicated support',
        'Custom integrations',
      ],
    },
  ];

  readonly onboardingForm = this.formBuilder.nonNullable.group({
    storeName: ['', [Validators.required, Validators.minLength(2)]],
    domain: ['', [Validators.required, Validators.minLength(3)]],
    tier: [Tier.Starter, Validators.required],
  });

  createStore(): void {
    if (this.onboardingForm.invalid) {
      return;
    }

    const { storeName, domain, tier } = this.onboardingForm.getRawValue();
    this.bootstrapping = true;
    this.bootstrapError = null;

    this.storeContextFacade
      .bootstrapStore(storeName, domain, tier)
      .pipe(
        take(1),
        finalize(() => (this.bootstrapping = false))
      )
      .subscribe({
        next: () => {
          // Success - the dashboard will automatically show after bootstrap
          this.onboardingForm.reset({ storeName: '', domain: '', tier: Tier.Starter });
        },
        error: (error) => {
          this.bootstrapError = error.message || 'Failed to create store. Please try again.';
        },
      });
  }

  getLicenseStatusClass(active: boolean, expiresAt?: string | null): string {
    return getLicenseStatusClass(active, expiresAt);
  }
}
