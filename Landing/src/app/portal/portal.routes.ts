import { Routes } from '@angular/router';

export const portalRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./portal.component').then(m => m.PortalComponent)
  }
];

