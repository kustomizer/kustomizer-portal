import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreContextFacade } from '../../../core/facades/store-context.facade';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>Stores</h2>
        <p>Manage your stores and view details.</p>
      </div>
    </div>

    <ng-container *ngIf="vm$ | async as vm">
      <div *ngIf="vm.state === 'loading'" class="state">Loading stores...</div>
      <div *ngIf="vm.state === 'error'" class="state error">{{ vm.error }}</div>
      <div *ngIf="vm.state === 'empty'" class="state">No stores found. Create one from the dashboard.</div>
      <div *ngIf="vm.state === 'ready' && vm.data" class="grid">
        <a
          class="card"
          *ngFor="let store of vm.data.stores"
          [routerLink]="['/app/stores', store.id]"
          [class.active]="store.id === vm.data.activeStore?.id"
        >
          <div class="store-header">
            <h3>{{ store.name }}</h3>
            <span class="badge" *ngIf="store.id === vm.data.activeStore?.id">Active</span>
          </div>
          <div class="meta">
            <p class="muted">Created {{ store.createdAt | date: 'mediumDate' }}</p>
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
        padding: 2rem 0;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
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
}
