import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { StoresRepository } from '../../repositories/stores.repository';
import { Store } from '../../models';
import { SupabaseClientService } from './supabase-client.service';
import { mapSupabaseErrorToDomainError } from './error-mapper';

type StoreCredentialRow = {
  domain: string;
  shopify_domain?: string | null;
  connected?: boolean;
  last_validated_at?: string | null;
};

type OwnerStoreConnectionsResponse = {
  connections?: StoreCredentialRow[];
};

type StoreRow = {
  domain: string;
  name: string;
  owner_id: string;
  created_at?: string;
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
          created_at
        `
        )
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return (data || []).map((row) => this.mapToStore(row as StoreRow));
      }),
      switchMap((stores) => this.attachCredentialStatus(stores)),
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
          created_at
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
        return data ? this.mapToStore(data as StoreRow) : null;
      }),
      switchMap((store) => {
        if (!store) {
          return of(null);
        }

        return this.attachCredentialStatus([store]).pipe(map((stores) => stores[0] ?? null));
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
    return {
      id: row.domain,
      domain: row.domain,
      name: row.name,
      ownerEmail: row.owner_id,
      createdAt: row.created_at,
      shopifyConnected: false,
      shopifyDomain: null,
      shopifyLastValidatedAt: null,
    };
  }

  private attachCredentialStatus(stores: Store[]): Observable<Store[]> {
    if (stores.length === 0) {
      return of(stores);
    }

    const domains = [...new Set(stores.map((store) => store.domain))];

    return from(
      this.supabaseClient.client.functions.invoke<OwnerStoreConnectionsResponse>(
        'owner_store_connections_get',
        {
          body: { domains },
        }
      )
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          // Do not block stores page when connection status lookup fails.
          return stores;
        }

        const credentialsByDomain = new Map<string, StoreCredentialRow>();
        for (const row of (data?.connections || []) as StoreCredentialRow[]) {
          credentialsByDomain.set(row.domain, row);
        }

        return stores.map((store) => this.applyCredentialState(store, credentialsByDomain.get(store.domain)));
      }),
      catchError(() => of(stores))
    );
  }

  private applyCredentialState(store: Store, credentials?: StoreCredentialRow): Store {
    const connected = credentials?.connected === true;

    return {
      ...store,
      shopifyConnected: connected,
      shopifyDomain: credentials?.shopify_domain ?? null,
      shopifyLastValidatedAt: credentials?.last_validated_at ?? null,
    };
  }
}
