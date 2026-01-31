import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import { ShopifyCredentialsFacade } from '../../../core/facades/shopify-credentials.facade';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';
import { Store } from '../../../core/models';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="header">
      <div>
        <h2>Store Details</h2>
        <p>View and manage store information</p>
      </div>
      <a routerLink="/app/stores" class="btn-secondary">← Back to Stores</a>
    </div>

    <ng-container *ngIf="store$ | async as store">
      <div *ngIf="!store" class="state error">Store not found</div>
      <div *ngIf="store" class="content">
        <section class="card">
          <h3>Store Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Store Name</label>
              <p>{{ store.name }}</p>
            </div>
            <div class="info-item">
              <label>Domain</label>
              <p>{{ store.domain }}</p>
            </div>
            <div class="info-item">
              <label>Created</label>
              <p>{{ store.createdAt | date: 'medium' }}</p>
            </div>
          </div>
        </section>

        <section class="card">
          <h3>Shopify Connection</h3>
          <p class="muted">
            Add a Shopify Admin API access token. The token is stored encrypted and will not be shown again.
          </p>

          <form class="shopify-form" [formGroup]="shopifyForm" (ngSubmit)="saveShopify(store.domain)">
            <div class="form-grid">
              <div class="form-group">
                <label for="shopifyDomain">Shopify domain</label>
                <input
                  id="shopifyDomain"
                  type="text"
                  formControlName="shopifyDomain"
                  placeholder="your-shop.myshopify.com"
                  [disabled]="savingShopify"
                />
              </div>

              <div class="form-group">
                <label for="accessToken">Access token</label>
                <input
                  id="accessToken"
                  type="password"
                  formControlName="accessToken"
                  placeholder="shpat_..."
                  [disabled]="savingShopify"
                />
              </div>
            </div>

            <button type="submit" class="btn-primary" [disabled]="shopifyForm.invalid || savingShopify">
              {{ savingShopify ? 'Saving...' : 'Save & verify' }}
            </button>

            <div *ngIf="shopifyError" class="state error">{{ shopifyError }}</div>
            <div *ngIf="shopifySuccess" class="state success">{{ shopifySuccess }}</div>
          </form>
        </section>

        <section class="card">
          <h3>Quick Actions</h3>
          <div class="actions">
            <button
              type="button"
              (click)="setAsActive(store.id)"
              class="action-btn"
              [disabled]="isActive(store.id)"
            >
              <span>{{ isActive(store.id) ? 'Current Active Store' : 'Set as Active Store' }}</span>
              <span class="arrow" *ngIf="!isActive(store.id)">→</span>
            </button>
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

      .state {
        color: var(--muted);
        padding: 0.75rem 0;
      }

      .state.error {
        color: var(--danger);
      }

      .state.success {
        color: #10b981;
      }

      .muted {
        margin: 0 0 1rem 0;
        color: var(--muted);
      }

      .content {
        display: grid;
        gap: 1.5rem;
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
      }

      .card h3 {
        margin: 0 0 0.75rem 0;
      }

      .info-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
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

      .shopify-form {
        display: grid;
        gap: 1rem;
      }

      .form-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--muted);
      }

      .form-group input {
        padding: 0.75rem 1rem;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--foreground);
        font-size: 1rem;
      }

      .form-group input:focus {
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
        justify-self: start;
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .actions {
        display: grid;
        gap: 0.75rem;
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
        cursor: pointer;
        color: var(--foreground);
        text-align: left;
      }

      .action-btn:hover:not(:disabled) {
        border-color: var(--primary);
        background: rgba(var(--primary-rgb), 0.1);
      }

      .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .action-btn .arrow {
        color: var(--primary);
        font-size: 1.2rem;
      }
    `,
  ],
})
export class StoreDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly storeContext = inject(StoreContextFacade);
  private readonly shopifyCredentials = inject(ShopifyCredentialsFacade);
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  savingShopify = false;
  shopifyError = '';
  shopifySuccess = '';

  readonly shopifyForm = this.formBuilder.group({
    shopifyDomain: ['', [Validators.required]],
    accessToken: ['', [Validators.required]],
  });

  readonly store$: Observable<Store | null> = this.route.params.pipe(
    switchMap((params) => {
      const storeId = params['storeId'];
      if (!storeId) {
        return of(null);
      }
      return this.storeContext.vm$.pipe(
        map((vm) => {
          if (vm.state === 'ready' && vm.data) {
            return vm.data.stores.find((s) => s.id === storeId) || null;
          }
          return null;
        })
      );
    })
  );

  private activeStoreId$ = this.storeContext.activeStoreId$;

  setAsActive(storeId: string): void {
    this.storeContext.setActiveStore(storeId);
  }

  isActive(storeId: string): boolean {
    let active = false;
    this.activeStoreId$.subscribe((id) => (active = id === storeId)).unsubscribe();
    return active;
  }

  saveShopify(domain: string): void {
    if (this.shopifyForm.invalid || this.savingShopify) {
      return;
    }

    this.shopifyError = '';
    this.shopifySuccess = '';
    this.savingShopify = true;

    this.cdr.detectChanges();

    const { shopifyDomain, accessToken } = this.shopifyForm.getRawValue();

    this.shopifyCredentials
      .upsertCredentials(domain, shopifyDomain ?? '', accessToken ?? '')
      .pipe(
        finalize(() => {
          this.savingShopify = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (result) => {
          this.shopifySuccess = `Connected to ${result.shopifyDomain}`;
          this.shopifyForm.patchValue({ accessToken: '' });
          this.cdr.detectChanges();
        },
        error: (error: Error) => {
          this.shopifyError = error instanceof Error ? error.message : 'Failed to save Shopify credentials.';
          this.cdr.detectChanges();
        },
      });
  }
}
