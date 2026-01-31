import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./public/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'privacy',
    loadComponent: () => import('./public/legal/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: 'terms',
    loadComponent: () => import('./public/legal/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: 'security',
    loadComponent: () => import('./public/legal/security.component').then((m) => m.SecurityComponent),
  },
  {
    path: 'pricing',
    loadComponent: () => import('./public/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'how-it-works',
    loadComponent: () =>
      import('./public/how-it-works/how-it-works.component').then((m) => m.HowItWorksComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./public/contact/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'app',
    loadChildren: () => import('./portal/portal.routes').then((m) => m.portalRoutes),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [authGuard, adminGuard],
  },
];
