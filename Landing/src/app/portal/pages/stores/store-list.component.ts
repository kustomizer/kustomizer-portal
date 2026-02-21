import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environment/environment';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';
import { resolveShopifyInstallUrl } from '../../../shared/utils/shopify-install';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>Stores</h2>
        <p>Owner stores are created from Shopify installation.</p>
      </div>
    </div>

    <ng-container *ngIf="vm$ | async as vm">
      <div *ngIf="vm.state === 'loading'" class="state">Loading stores...</div>
      <div *ngIf="vm.state === 'error'" class="state error">{{ vm.error }}</div>

      <section *ngIf="vm.state === 'empty'" class="card empty-state">
        <h3>No stores connected yet</h3>
        <p>
          Install Kustomizer in Shopify to create your owner store. Once installed, your store will
          appear here automatically.
        </p>

        <div class="empty-actions">
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

        <p class="muted" *ngIf="!shopifyInstallUrl">
          Shopify install URL is not configured yet. Contact support.
        </p>
      </section>

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
              {{ store.id === vm.data.activeStore?.id ? 'Current active store' : 'Set active' }}
            </button>
            <a [routerLink]="['/app/stores', store.id]" class="btn-link">View details -></a>
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

      .state {
        color: var(--muted);
        padding: 2rem 0;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
      }

      .empty-state {
        margin-bottom: 1.5rem;
      }

      .empty-state p {
        color: var(--muted);
      }

      .empty-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        margin-top: 1rem;
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

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

  readonly vm$ = this.storeContext.vm$;
  readonly shopifyInstallUrl = resolveShopifyInstallUrl(environment.publicShopifyInstallUrl);

  setActiveStore(storeId: string): void {
    this.storeContext.setActiveStore(storeId);
  }

  openShopifyInstall(): void {
    if (!this.shopifyInstallUrl || typeof window === 'undefined') {
      return;
    }

    window.location.assign(this.shopifyInstallUrl);
  }
}
