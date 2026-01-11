import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin.component').then(m => m.AdminComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'orgs',
      },
      {
        path: 'orgs',
        loadComponent: () => import('./pages/orgs/admin-orgs.component').then(m => m.AdminOrgsComponent),
      },
      {
        path: 'orgs/:orgId',
        loadComponent: () =>
          import('./pages/orgs/admin-org-detail.component').then(m => m.AdminOrgDetailComponent),
      },
      {
        path: 'licenses',
        loadComponent: () =>
          import('./pages/licenses/admin-licenses.component').then(m => m.AdminLicensesComponent),
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audit/admin-audit.component').then(m => m.AdminAuditComponent),
      },
      {
        path: 'stores/:storeId/domains',
        loadComponent: () =>
          import('./pages/stores/admin-store-domains.component').then(m => m.AdminStoreDomainsComponent),
      },
    ],
  },
];
