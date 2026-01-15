import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminFacade } from '../../../core/facades/admin.facade';

@Component({
  selector: 'app-admin-stores-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="header">
      <div>
        <h2>All Stores</h2>
        <p>Manage stores and licenses across the platform</p>
      </div>
    </div>

    <ng-container *ngIf="stores$ | async as storesState">
      <div *ngIf="storesState.state === 'loading'" class="state">Loading stores...</div>
      <div *ngIf="storesState.state === 'error'" class="state error">{{ storesState.error }}</div>
      <div *ngIf="storesState.state === 'empty'" class="state">No stores found in the system.</div>
      
      <div *ngIf="storesState.state === 'ready' && storesState.data" class="content">
        <div class="stats-bar">
          <div class="stat">
            <label>Total Stores</label>
            <h3>{{ storesState.data.stores.length }}</h3>
          </div>
        </div>

        <div class="table-container">
          <table class="stores-table">
            <thead>
              <tr>
                <th>Store Name</th>
                <th>Store ID</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let store of storesState.data.stores" class="store-row">
                <td>
                  <strong>{{ store.name }}</strong>
                </td>
                <td>
                  <code>{{ store.id }}</code>
                </td>
                <td>{{ store.createdAt | date: 'medium' }}</td>
                <td>
                  <a [routerLink]="['/admin/stores', store.id]" class="btn-action">
                    View Details →
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>
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
        padding: 3rem 0;
        text-align: center;
      }

      .state.error {
        color: var(--danger);
      }

      .content {
        display: grid;
        gap: 1.5rem;
      }

      .stats-bar {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .stat {
        padding: 1.5rem;
        border-radius: 16px;
        background: var(--card);
        border: 1px solid var(--border);
      }

      .stat label {
        display: block;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
        margin-bottom: 0.5rem;
      }

      .stat h3 {
        margin: 0;
        font-size: 2rem;
        color: var(--primary);
      }

      .table-container {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 20px;
        overflow: hidden;
      }

      .stores-table {
        width: 100%;
        border-collapse: collapse;
      }

      .stores-table thead {
        background: var(--card-soft);
        border-bottom: 1px solid var(--border);
      }

      .stores-table th {
        text-align: left;
        padding: 1rem 1.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }

      .stores-table td {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border);
      }

      .store-row:last-child td {
        border-bottom: none;
      }

      .store-row:hover {
        background: var(--card-soft);
      }

      .stores-table code {
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        background: var(--card-soft);
        font-size: 0.85rem;
        color: var(--primary);
      }

      .btn-action {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 10px;
        background: var(--primary);
        color: #0a0d10;
        font-weight: 600;
        font-size: 0.85rem;
        transition: opacity 0.2s;
      }

      .btn-action:hover {
        opacity: 0.9;
      }

      @media (max-width: 768px) {
        .table-container {
          overflow-x: auto;
        }

        .stores-table {
          min-width: 600px;
        }
      }
    `,
  ],
})
export class AdminStoresListComponent implements OnInit {
  private readonly adminFacade = inject(AdminFacade);

  readonly stores$ = this.adminFacade.stores$;

  ngOnInit(): void {
    this.adminFacade.loadStores();
  }
}

