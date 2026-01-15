import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthFacade } from '../facades/auth.facade';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  return auth.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }
      return user.role === 'admin' ? true : router.createUrlTree(['/app']);
    })
  );
};
