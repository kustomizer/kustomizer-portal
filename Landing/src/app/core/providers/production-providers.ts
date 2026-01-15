import { Provider } from '@angular/core';
import {
  AUTH_REPOSITORY,
  STORES_REPOSITORY,
  LICENSES_REPOSITORY,
  DOMAINS_REPOSITORY,
  MEMBERSHIPS_REPOSITORY,
  BOOTSTRAP_REPOSITORY,
  ADMIN_REPOSITORY,
} from '../repositories';
import { SupabaseAuthRepository } from '../infrastructure/supabase/supabase-auth.repository';
import { SupabaseStoresRepository } from '../infrastructure/supabase/supabase-stores.repository';
import { SupabaseLicensesRepository } from '../infrastructure/supabase/supabase-licenses.repository';
import { SupabaseDomainsRepository } from '../infrastructure/supabase/supabase-domains.repository';
import { EdgeMembershipsRepository } from '../infrastructure/edge/edge-memberships.repository';
import { EdgeBootstrapRepository } from '../infrastructure/edge/edge-bootstrap.repository';
import { EdgeAdminRepository } from '../infrastructure/edge/edge-admin.repository';
import { SupabaseClientService } from '../infrastructure/supabase/supabase-client.service';
import { EdgeClientService } from '../infrastructure/edge/edge-client.service';

/**
 * Provides production repository implementations using Supabase and Edge Functions
 */
export const provideProductionRepositories = (): Provider[] => [
  // Infrastructure services
  SupabaseClientService,
  EdgeClientService,

  // Authentication
  { provide: AUTH_REPOSITORY, useClass: SupabaseAuthRepository },

  // Portal repositories (Supabase with RLS)
  { provide: STORES_REPOSITORY, useClass: SupabaseStoresRepository },
  { provide: LICENSES_REPOSITORY, useClass: SupabaseLicensesRepository },
  { provide: DOMAINS_REPOSITORY, useClass: SupabaseDomainsRepository },

  // Edge Function repositories
  { provide: MEMBERSHIPS_REPOSITORY, useClass: EdgeMembershipsRepository },
  { provide: BOOTSTRAP_REPOSITORY, useClass: EdgeBootstrapRepository },
  { provide: ADMIN_REPOSITORY, useClass: EdgeAdminRepository },
];
