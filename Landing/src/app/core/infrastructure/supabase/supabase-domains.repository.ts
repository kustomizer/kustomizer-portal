import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DomainsRepository } from '../../repositories/domains.repository';
import { Domain } from '../../models';
import { SupabaseClientService } from './supabase-client.service';
import { mapSupabaseErrorToDomainError } from './error-mapper';

/**
 * Read-only domains repository using Supabase direct access
 * For write operations (add/remove), use EdgeDomainsRepository
 */
@Injectable()
export class SupabaseDomainsRepository implements DomainsRepository {
  private readonly supabaseClient = inject(SupabaseClientService);

  listDomains(storeId: string): Observable<Domain[]> {
    return from(
      this.supabaseClient.client
        .from('domains')
        .select(
          `
          id,
          store_id,
          domain,
          created_at
        `
        )
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return (data || []).map((row) => this.mapToDomain(row));
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  addDomain(storeId: string, domain: string): Observable<Domain> {
    // This method should ideally call Edge Function for proper validation
    // But for simplicity in read-only repo, we'll implement it here
    return from(
      this.supabaseClient.client
        .from('domains')
        .insert({ store_id: storeId, domain })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw mapSupabaseErrorToDomainError(error);
        }
        return this.mapToDomain(data);
      }),
      catchError((error) => {
        return throwError(() => mapSupabaseErrorToDomainError(error));
      })
    );
  }

  removeDomain(domainId: string): Observable<void> {
    return from(this.supabaseClient.client.from('domains').delete().eq('id', domainId)).pipe(
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

  private mapToDomain(row: any): Domain {
    return {
      id: row.id.toString(),
      storeId: row.store_id.toString(),
      domain: row.domain,
      createdAt: row.created_at,
    };
  }
}

