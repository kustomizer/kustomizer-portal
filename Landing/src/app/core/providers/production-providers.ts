import { Provider } from '@angular/core';
import {
  AUTH_REPOSITORY,
  STORES_REPOSITORY,
  LICENSES_REPOSITORY,
  STORE_USERS_REPOSITORY,
  BOOTSTRAP_REPOSITORY,
  ADMIN_REPOSITORY,
  SHOPIFY_CREDENTIALS_REPOSITORY,
} from '../repositories';
import { SupabaseAuthRepository } from '../infrastructure/supabase/supabase-auth.repository';
import { SupabaseStoresRepository } from '../infrastructure/supabase/supabase-stores.repository';
import { SupabaseLicensesRepository } from '../infrastructure/supabase/supabase-licenses.repository';
import { EdgeStoreUsersRepository } from '../infrastructure/edge/edge-store-users.repository';
import { EdgeBootstrapRepository } from '../infrastructure/edge/edge-bootstrap.repository';
import { EdgeAdminRepository } from '../infrastructure/edge/edge-admin.repository';
import { EdgeShopifyCredentialsRepository } from '../infrastructure/edge/edge-shopify-credentials.repository';
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
  // Edge Function repositories
  { provide: STORE_USERS_REPOSITORY, useClass: EdgeStoreUsersRepository },
  { provide: BOOTSTRAP_REPOSITORY, useClass: EdgeBootstrapRepository },
  { provide: ADMIN_REPOSITORY, useClass: EdgeAdminRepository },
  { provide: SHOPIFY_CREDENTIALS_REPOSITORY, useClass: EdgeShopifyCredentialsRepository },
];
