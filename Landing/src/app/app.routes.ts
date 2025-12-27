import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'pricing',
    loadComponent: () => import('./public/pricing/pricing.component').then(m => m.PricingComponent)
  },
  {
    path: 'how-it-works',
    loadComponent: () => import('./public/how-it-works/how-it-works.component').then(m => m.HowItWorksComponent)
  },
  {
    path: 'contact',
    loadComponent: () => import('./public/contact/contact.component').then(m => m.ContactComponent)
  },
  {
    path: 'app',
    loadChildren: () => import('./portal/portal.routes').then(m => m.portalRoutes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
  }
];
