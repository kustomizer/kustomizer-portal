import { Routes } from '@angular/router';

export const portalRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./portal.component').then(m => m.PortalComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/portal-dashboard.component').then(m => m.PortalDashboardComponent),
      },
      {
        path: 'stores',
        loadComponent: () =>
          import('./pages/stores/store-list.component').then(m => m.StoreListComponent),
      },
      {
        path: 'stores/:storeId',
        loadComponent: () =>
          import('./pages/stores/store-detail.component').then(m => m.StoreDetailComponent),
      },
      {
        path: 'stores/:storeId/domains',
        loadComponent: () =>
          import('./pages/stores/store-domains.component').then(m => m.StoreDomainsComponent),
      },
      {
        path: 'tier',
        loadComponent: () => import('./pages/tier/portal-tier.component').then(m => m.PortalTierComponent),
      },
      {
        path: 'install',
        loadComponent: () =>
          import('./pages/install/portal-install.component').then(m => m.PortalInstallComponent),
      },
    ],
  },
];
