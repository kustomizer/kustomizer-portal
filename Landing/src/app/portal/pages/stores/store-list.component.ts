import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortalStoresFacade } from '../../../core/facades/portal-stores.facade';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>Stores</h2>
        <p>Manage connected Shopify stores and their sync health.</p>
      </div>
    </div>

    <ng-container *ngIf="stores$ | async as storesState">
      <div *ngIf="storesState.state === 'loading'" class="state">Loading stores...</div>
      <div *ngIf="storesState.state === 'error'" class="state error">{{ storesState.error }}</div>
      <div *ngIf="storesState.state === 'empty'" class="state">No stores connected yet.</div>
      <div *ngIf="storesState.state === 'ready'" class="grid">
        <a
          class="card"
          *ngFor="let store of storesState.data ?? []"
          [routerLink]="['/app/stores', store.id]"
        >
          <div>
            <h3>{{ store.metadata?.shopName || store.shopDomain }}</h3>
            <p>{{ store.shopDomain }}</p>
          </div>
          <div class="meta">
            <span [class.error]="store.status === 'error'">
              {{ store.status | titlecase }}
            </span>
            <small>Last sync {{ store.lastSyncAt | date: 'short' }}</small>
          </div>
        </a>
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
      }

      .state.error {
        color: var(--danger);
      }

      .grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.25rem;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: var(--card);
        transition: transform 0.2s ease, border-color 0.2s ease;
      }

      .card:hover {
        transform: translateY(-2px);
        border-color: var(--primary);
      }

      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--muted);
        font-size: 0.85rem;
      }

      .meta span.error {
        color: var(--danger);
      }
    `,
  ],
})
export class StoreListComponent {
  private readonly facade = inject(PortalStoresFacade);

  readonly stores$ = this.facade.stores$;
}
