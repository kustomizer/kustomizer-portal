import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';
import { LicenseFacade } from '../../../core/facades/license.facade';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';
import { getLicenseStatusClass } from '../../../shared/utils/enum-labels';
import { resolveShopifyInstallUrl } from '../../../shared/utils/shopify-install';

@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="storeContext$ | async as ctx">
      <div *ngIf="ctx.state === 'empty' && ctx.data?.needsBootstrap" class="onboarding-card">
        <div class="onboarding-header">
          <h2>Connect your Shopify store</h2>
          <p>
            Owner onboarding is handled from Shopify. Install Kustomizer there and your store will
            appear automatically in this portal.
          </p>
        </div>

        <div class="onboarding-actions">
          <button
            type="button"
            class="btn-primary"
            (click)="openShopifyInstall()"
            [disabled]="!shopifyInstallUrl"
          >
            Install on Shopify
          </button>
          <a routerLink="/app/install" class="btn-link">See integration guide</a>
        </div>

        <p class="hint" *ngIf="!shopifyInstallUrl">
          Shopify install URL is not configured yet. Contact support.
        </p>

        <p class="hint">
          Already invited by an owner? Sign in with that email and your store access will appear.
        </p>
      </div>
    </ng-container>

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
              <h2
                [class]="
                  getLicenseStatusClass(
                    licenseState.data.license?.active ?? false,
                    licenseState.data.license?.expiresAt
                  )
                "
              >
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
        <h3>Quick stats</h3>
        <ng-container *ngIf="storeContext$ | async as storeCtx">
          <div *ngIf="storeCtx.state === 'ready' && storeCtx.data" class="stats">
            <div class="stat">
              <p class="label">Active store</p>
              <h3>{{ storeCtx.data.activeStore?.name || 'None' }}</h3>
            </div>
            <div class="stat">
              <p class="label">Total stores</p>
              <h3>{{ storeCtx.data.stores.length }}</h3>
            </div>
          </div>
        </ng-container>
      </section>

      <section class="card">
        <h3>Quick actions</h3>
        <div class="actions">
          <a routerLink="/app/stores" class="action-btn">
            <span>Manage stores</span>
            <span class="arrow">-></span>
          </a>
          <a routerLink="/app/team" class="action-btn">
            <span>Invite team members</span>
            <span class="arrow">-></span>
          </a>
          <a routerLink="/app/tier" class="action-btn">
            <span>Upgrade plan</span>
            <span class="arrow">-></span>
          </a>
          <a routerLink="/app/install" class="action-btn">
            <span>Installation guide</span>
            <span class="arrow">-></span>
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
        padding: 2.5rem 2rem;
        max-width: 760px;
        margin: 0 auto 2rem;
        box-shadow: var(--shadow-soft);
      }

      .onboarding-header {
        margin-bottom: 1.5rem;
      }

      .onboarding-header h2 {
        margin-bottom: 0.6rem;
      }

      .onboarding-header p,
      .hint {
        color: var(--muted);
        margin: 0;
      }

      .onboarding-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 1rem;
      }

      .btn-primary {
        padding: 0.85rem 1.4rem;
        border-radius: 12px;
        border: none;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-link {
        color: var(--primary);
        font-weight: 600;
      }

      .btn-secondary {
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--foreground);
        font-weight: 600;
        cursor: pointer;
      }

      .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .hint.error {
        color: var(--danger);
      }

      .hint.success {
        color: #10b981;
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
        font-size: 1rem;
      }
    `,
  ],
})
export class PortalDashboardComponent implements OnInit {
  private readonly storeContextFacade = inject(StoreContextFacade);
  private readonly licenseFacade = inject(LicenseFacade);
  private readonly route = inject(ActivatedRoute);

  readonly storeContext$ = this.storeContextFacade.vm$;
  readonly licenseVm$ = this.licenseFacade.vm$;
  readonly shopifyInstallUrl = resolveShopifyInstallUrl(environment.publicShopifyInstallUrl);

  ngOnInit(): void {
    const shouldRedirectToShopify = this.route.snapshot.queryParamMap.get('onboarding') === 'shopify';
    if (!shouldRedirectToShopify || !this.shopifyInstallUrl) {
      return;
    }

    this.storeContext$
      .pipe(
        filter((state) => state.state !== 'loading'),
        take(1)
      )
      .subscribe((state) => {
        if (state.state === 'empty' && state.data?.needsBootstrap) {
          this.openShopifyInstall();
        }
      });
  }

  openShopifyInstall(): void {
    if (!this.shopifyInstallUrl || typeof window === 'undefined') {
      return;
    }

    const openedWindow = window.open(this.shopifyInstallUrl, '_blank', 'noopener,noreferrer');
    if (!openedWindow) {
      window.location.assign(this.shopifyInstallUrl);
    }
  }

  getLicenseStatusClass(active: boolean, expiresAt?: string | null): string {
    return getLicenseStatusClass(active, expiresAt);
  }
}
