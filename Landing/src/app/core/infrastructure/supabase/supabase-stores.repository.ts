import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { StoresRepository } from '../../repositories/stores.repository';
import { Store } from '../../models';
import { SupabaseClientService } from './supabase-client.service';
import { mapSupabaseErrorToDomainError } from './error-mapper';

@Injectable()
export class SupabaseStoresRepository implements StoresRepository {
  private readonly supabaseClient = inject(SupabaseClientService);

  listMyStores(): Observable<Store[]> {
    return from(
      this.supabaseClient.client
        .from('stores')
        .select(
          `
          id,
          name,
          created_at,
          metadata
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
          id,
          name,
          created_at,
          metadata
        `
        )
        .eq('id', id)
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

  createStore(name: string, metadata?: Record<string, any>): Observable<Store> {
    return from(
      this.supabaseClient.client
        .from('stores')
        .insert({ name, metadata: metadata || {} })
        .select()
        .single()
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

  updateStore(id: string, changes: Partial<Store>): Observable<Store> {
    const updateData: any = {};
    if (changes.name !== undefined) updateData.name = changes.name;
    if (changes.metadata !== undefined) updateData.metadata = changes.metadata;

    return from(
      this.supabaseClient.client.from('stores').update(updateData).eq('id', id).select().single()
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
    return from(this.supabaseClient.client.from('stores').delete().eq('id', id)).pipe(
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

  private mapToStore(row: any): Store {
    return {
      id: row.id.toString(),
      name: row.name,
      createdAt: row.created_at,
      metadata: row.metadata || {},
    };
  }
}

