import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SupabaseClientService } from '../infrastructure/supabase/supabase-client.service';

export const authGuard: CanActivateFn = () => {
  const supabaseClient = inject(SupabaseClientService);
  const router = inject(Router);

  return supabaseClient.authState$.pipe(
    take(1),
    map((session) => {
      if (session && session.userId) {
        return true;
      }
      return router.createUrlTree(['/login']);
    })
  );
};
