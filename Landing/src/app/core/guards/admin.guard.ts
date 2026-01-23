import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AdminFacade } from '../facades/admin.facade';

/**
 * Admin guard using server-side validation
 *
 * IMPORTANT: Admin status is determined server-side via Edge Functions
 * checking the internal_admins table or auth claims.
 * Do NOT rely on client-side user.role field for authorization.
 */
export const adminGuard: CanActivateFn = () => {
  const adminFacade = inject(AdminFacade);
  const router = inject(Router);

  return adminFacade.isAdmin().pipe(  // ← Server-side check via Edge Function
    take(1),
    map((isAdmin) => {
      if (isAdmin) {
        return true;  // Admin access granted
      }
      return router.createUrlTree(['/app/dashboard']);  // Redirect non-admins
    }),
    catchError(() => {
      // On error, deny access
      return of(router.createUrlTree(['/app/dashboard']));
    })
  );
};
