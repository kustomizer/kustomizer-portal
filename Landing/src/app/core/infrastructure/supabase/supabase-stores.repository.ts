import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { StoresRepository } from '../../repositories/stores.repository';
import { Store } from '../../models';
import { SupabaseClientService } from './supabase-client.service';
import { mapSupabaseErrorToDomainError } from './error-mapper';

type StoreCredentialRow = {
  shopify_domain?: string | null;
  access_token_ciphertext?: string | null;
  access_token_iv?: string | null;
  last_validated_at?: string | null;
};

type StoreRow = {
  domain: string;
  name: string;
  owner_id: string;
  created_at?: string;
  store_shopify_credentials?: StoreCredentialRow | StoreCredentialRow[] | null;
};

@Injectable()
export class SupabaseStoresRepository implements StoresRepository {
  private readonly supabaseClient = inject(SupabaseClientService);

  listMyStores(): Observable<Store[]> {
    return from(
      this.supabaseClient.client
        .from('stores')
        .select(
          `
          domain,
          name,
          owner_id,
          created_at,
          store_shopify_credentials (
            shopify_domain,
            access_token_ciphertext,
            access_token_iv,
            last_validated_at
          )
        `
        )
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return (data || []).map((row) => this.mapToStore(row));
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  getStore(id: string): Observable<Store | null> {
    return from(
      this.supabaseClient.client
        .from('stores')
        .select(
          `
          domain,
          name,
          owner_id,
          created_at,
          store_shopify_credentials (
            shopify_domain,
            access_token_ciphertext,
            access_token_iv,
            last_validated_at
          )
        `
        )
        .eq('domain', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          // 404 is acceptable for getStore
          if (error.code === 'PGRST116') {
            return null;
          }
          throw mapSupabaseErrorToDomainError(error);
        }
        return data ? this.mapToStore(data) : null;
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  createStore(domain: string, name: string): Observable<Store> {
    return from(this.supabaseClient.getUser()).pipe(
      switchMap((user) => {
        if (!user?.email) {
          throw mapSupabaseErrorToDomainError({ message: 'User email not available' });
        }
        return from(
          this.supabaseClient.client
            .from('stores')
            .insert({ domain, name, owner_id: user.email })
            .select()
            .single()
        );
      }),
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return this.mapToStore(data);
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  updateStore(id: string, changes: Partial<Store>): Observable<Store> {
    const updateData: any = {};
    if (changes.name !== undefined) updateData.name = changes.name;
    if (changes.ownerEmail !== undefined) updateData.owner_id = changes.ownerEmail;

    return from(
      this.supabaseClient.client.from('stores').update(updateData).eq('domain', id).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return this.mapToStore(data);
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  deleteStore(id: string): Observable<void> {
    return from(this.supabaseClient.client.from('stores').delete().eq('domain', id)).pipe(
      map(({ error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return undefined;
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  private mapToStore(row: StoreRow): Store {
    const credentials = this.pickCredentialRow(row.store_shopify_credentials);

    const hasCiphertext =
      typeof credentials?.access_token_ciphertext === 'string' &&
      credentials.access_token_ciphertext.length > 0;
    const hasIv = typeof credentials?.access_token_iv === 'string' && credentials.access_token_iv.length > 0;

    return {
      id: row.domain,
      domain: row.domain,
      name: row.name,
      ownerEmail: row.owner_id,
      createdAt: row.created_at,
      shopifyConnected: hasCiphertext && hasIv,
      shopifyDomain: credentials?.shopify_domain ?? null,
      shopifyLastValidatedAt: credentials?.last_validated_at ?? null,
    };
  }

  private pickCredentialRow(
    credentials: StoreRow['store_shopify_credentials']
  ): StoreCredentialRow | null {
    if (!credentials) {
      return null;
    }

    if (Array.isArray(credentials)) {
      return credentials[0] ?? null;
    }

    return credentials;
  }
}
