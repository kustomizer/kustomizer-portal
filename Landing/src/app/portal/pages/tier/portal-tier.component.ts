import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize, take } from 'rxjs/operators';
import { LicenseFacade } from '../../../core/facades/license.facade';
import { Tier } from '../../../core/types/enums';
import { getTierFeatures } from '../../../shared/utils/enum-labels';

interface TierOption {
  tier: Tier;
  label: string;
  price: string;
  features: string[];
  popular?: boolean;
}

@Component({
  selector: 'app-portal-tier',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <h2>Change Plan</h2>
      <p>Choose the plan that fits your needs. Changes take effect immediately (no billing in MVP).</p>
    </div>

    <ng-container *ngIf="licenseVm$ | async as vm">
      <div *ngIf="vm.state === 'loading'" class="state">Loading license information...</div>
      <div *ngIf="vm.state === 'error'" class="state error">{{ vm.error }}</div>
      
      <div *ngIf="vm.state === 'ready' && vm.data" class="current-plan">
        <div class="badge-current">Current Plan</div>
        <h3>{{ vm.data.tierLabel }}</h3>
        <p class="muted">{{ vm.data.statusLabel }} • {{ vm.data.expiresIn }}</p>
      </div>

      <div *ngIf="errorMessage" class="error-banner">{{ errorMessage }}</div>
      <div *ngIf="successMessage" class="success-banner">{{ successMessage }}</div>

      <div class="grid">
        <div
          *ngFor="let option of tierOptions"
          class="card"
          [class.highlight]="option.popular"
          [class.current]="vm.state === 'ready' && vm.data?.license?.tier === option.tier"
        >
          <div class="badge" *ngIf="option.popular">Popular</div>
          <div class="badge-current" *ngIf="vm.state === 'ready' && vm.data?.license?.tier === option.tier">
            Current
          </div>
          <h3>{{ option.label }}</h3>
          <p class="price">{{ option.price }}</p>
          <ul>
            <li *ngFor="let feature of option.features">{{ feature }}</li>
          </ul>
          <button
            type="button"
            (click)="changeTier(option.tier, option.label)"
            [disabled]="isChanging || (vm.state === 'ready' && vm.data?.license?.tier === option.tier)"
            [class.btn-primary]="vm.state === 'ready' && vm.data?.license?.tier !== option.tier"
            [class.btn-disabled]="vm.state === 'ready' && vm.data?.license?.tier === option.tier"
          >
            {{
              isChanging && selectedTier === option.tier
                ? 'Updating...'
                : vm.state === 'ready' && vm.data?.license?.tier === option.tier
                ? 'Current Plan'
                : 'Select ' + option.label
            }}
          </button>
        </div>
      </div>
    </ng-container>

    <div class="notice">
      <h4>💡 Note</h4>
      <p>
        This is an MVP version. Billing is not active yet. Tier changes are applied immediately for
        testing purposes. Contact sales for production pricing and custom enterprise plans.
      </p>
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

      .state {
        color: var(--muted);
        padding: 2rem 0;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
      }

      .current-plan {
        position: relative;
        padding: 1.5rem;
        border-radius: 16px;
        background: var(--card);
        border: 2px solid var(--primary);
        margin-bottom: 2rem;
      }

      .badge-current {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        background: var(--primary);
        color: #0a0d10;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }

      .current-plan h3 {
        margin: 0.5rem 0;
      }

      .error-banner {
        padding: 1rem;
        border-radius: 12px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
        color: #ef4444;
        margin-bottom: 1.5rem;
      }

      .success-banner {
        padding: 1rem;
        border-radius: 12px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid #10b981;
        color: #10b981;
        margin-bottom: 1.5rem;
      }

      .grid {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        margin-bottom: 2rem;
      }

      .card {
        background: var(--card);
        border: 2px solid var(--border);
        border-radius: 20px;
        padding: 2rem 1.5rem;
        display: grid;
        gap: 1rem;
        position: relative;
        transition: all 0.2s;
      }

      .card:hover:not(.current) {
        border-color: var(--primary);
        transform: translateY(-2px);
      }

      .card.highlight {
        border-color: var(--primary);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }

      .card.current {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.05);
      }

      .badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--primary);
        color: #0a0d10;
        padding: 0.3rem 0.75rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .card h3 {
        margin: 0;
        font-size: 1.5rem;
      }

      .price {
        font-size: 1.6rem;
        font-weight: 600;
        margin: 0;
        color: var(--primary);
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.5rem;
        color: var(--muted);
        font-size: 0.95rem;
      }

      ul li::before {
        content: '✓ ';
        color: var(--primary);
        font-weight: bold;
        margin-right: 0.5rem;
      }

      button {
        border-radius: 12px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        padding: 0.85rem 1rem;
        font-size: 1rem;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--primary);
        color: #0a0d10;
      }

      .btn-primary:hover:not(:disabled) {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .btn-disabled {
        background: var(--card-soft);
        color: var(--muted);
        border: 1px solid var(--border);
        cursor: not-allowed;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .notice {
        padding: 1.5rem;
        border-radius: 16px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid #3b82f6;
      }

      .notice h4 {
        margin: 0 0 0.5rem 0;
        color: #3b82f6;
      }

      .notice p {
        margin: 0;
        color: var(--muted);
        font-size: 0.9rem;
      }

      .muted {
        color: var(--muted);
      }

      @media (max-width: 768px) {
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PortalTierComponent {
  private readonly licenseFacade = inject(LicenseFacade);

  readonly licenseVm$ = this.licenseFacade.vm$;

  isChanging = false;
  selectedTier: Tier | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  readonly tierOptions: TierOption[] = [
    {
      tier: Tier.Starter,
      label: 'Starter',
      price: '$29/month',
      features: getTierFeatures(Tier.Starter),
    },
    {
      tier: Tier.Growth,
      label: 'Growth',
      price: '$99/month',
      features: getTierFeatures(Tier.Growth),
      popular: true,
    },
    {
      tier: Tier.Enterprise,
      label: 'Enterprise',
      price: 'Custom',
      features: getTierFeatures(Tier.Enterprise),
    },
  ];

  changeTier(tier: Tier, label: string): void {
    if (!confirm(`Are you sure you want to change to the ${label} plan?`)) {
      return;
    }

    this.isChanging = true;
    this.selectedTier = tier;
    this.errorMessage = null;
    this.successMessage = null;

    this.licenseFacade
      .updateTier(tier)
      .pipe(
        take(1),
        finalize(() => {
          this.isChanging = false;
          this.selectedTier = null;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = `Successfully changed to ${label} plan!`;
          setTimeout(() => (this.successMessage = null), 5000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to change tier. Please try again.';
        },
      });
  }
}
