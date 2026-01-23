import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, switchMap, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';
import { Store } from '../../../core/models';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
          <h3>Quick Actions</h3>
          <div class="actions">
            <button type="button" (click)="setAsActive(store.id)" class="action-btn" [disabled]="isActive(store.id)">
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
        padding: 2rem;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
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
        margin: 0 0 1rem 0;
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

}
