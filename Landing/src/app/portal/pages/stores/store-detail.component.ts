import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { PortalStoreFacade } from '../../../core/facades/portal-store.facade';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <ng-container *ngIf="storeState$ | async as storeState">
      <div *ngIf="storeState.state === 'loading'" class="state">Loading store...</div>
      <div *ngIf="storeState.state === 'error'" class="state error">{{ storeState.error }}</div>
      <div *ngIf="storeState.state === 'empty'" class="state">Store not found.</div>

      <div *ngIf="storeState.state === 'ready'" class="card">
        <div class="header">
          <div>
            <p class="eyebrow">Shopify store</p>
            <h2>{{ storeState.data?.metadata?.shopName || storeState.data?.shopDomain }}</h2>
            <p>{{ storeState.data?.shopDomain }}</p>
          </div>
          <div class="actions">
            <a class="ghost" routerLink="/app/stores">Back to stores</a>
            <a class="cta" [routerLink]="['/app/stores', storeState.data?.id, 'domains']">
              Manage domains
            </a>
          </div>
        </div>
        <div class="details">
          <div>
            <p class="label">Status</p>
            <p>{{ storeState.data?.status | titlecase }}</p>
          </div>
          <div>
            <p class="label">Last sync</p>
            <p>{{ storeState.data?.lastSyncAt | date: 'medium' }}</p>
          </div>
          <div>
            <p class="label">Last error</p>
            <p>{{ storeState.data?.lastError || 'None' }}</p>
          </div>
          <div>
            <p class="label">Contact email</p>
            <p>{{ storeState.data?.metadata?.email || '—' }}</p>
          </div>
          <div>
            <p class="label">Installed</p>
            <p>{{ storeState.data?.metadata?.installedAt | date: 'mediumDate' }}</p>
          </div>
          <div>
            <p class="label">Locale</p>
            <p>
              {{ storeState.data?.metadata?.country || '—' }} ·
              {{ storeState.data?.metadata?.currency || '—' }}
            </p>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [
    `
      .state {
        color: var(--muted);
      }

      .state.error {
        color: var(--danger);
      }

      .card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
        box-shadow: var(--shadow-soft);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .eyebrow {
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.2em;
        color: var(--muted);
      }

      .cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.6rem 1rem;
        border-radius: 12px;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
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

      .actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .details {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        margin-top: 1.5rem;
      }

      .label {
        text-transform: uppercase;
        font-size: 0.7rem;
        color: var(--muted);
        letter-spacing: 0.15em;
      }
    `,
  ],
})
export class StoreDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PortalStoreFacade);

  readonly storeState$ = this.route.paramMap.pipe(
    map(params => params.get('storeId') ?? ''),
    switchMap(storeId => this.facade.store(storeId))
  );
}
