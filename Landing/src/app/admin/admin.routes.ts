import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin.component').then(m => m.AdminComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'stores',
      },
      {
        path: 'stores',
        loadComponent: () => import('./pages/stores/admin-stores-list.component').then(m => m.AdminStoresListComponent),
      },
      {
        path: 'stores/:storeId',
        loadComponent: () =>
          import('./pages/stores/admin-store-detail.component').then(m => m.AdminStoreDetailComponent),
      },
      // Legacy routes for backward compatibility
      {
        path: 'orgs',
        redirectTo: 'stores',
      },
      {
        path: 'orgs/:orgId',
        redirectTo: 'stores/:orgId',
      },
    ],
  },
];
