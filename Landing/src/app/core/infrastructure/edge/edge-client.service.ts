import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { SupabaseClientService } from '../supabase/supabase-client.service';
import { mapHttpErrorToDomainError } from '../supabase/error-mapper';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

/**
 * Edge Function client using native Supabase methods
 *
 * IMPORTANT: Use supabase.functions.invoke() instead of manual fetch:
 * - Automatically handles JSON serialization (no need for JSON.stringify)
 * - Automatically adds auth headers
 * - Type-safe request/response
 * - Better error handling
 *
 * @see https://supabase.com/docs/reference/javascript/functions-invoke
 */
@Injectable({ providedIn: 'root' })
export class EdgeClientService {
  private readonly supabaseClient = inject(SupabaseClientService);

  /**
   * Call an Edge Function with authentication
   *
   * @param functionName - The name of the Edge Function
   * @param body - Request body (will be automatically JSON-encoded)
   * @returns Observable of the response
   */
  callFunction<TRequest extends Record<string, any> | void = void, TResponse = unknown>(
    functionName: string,
    body?: TRequest
  ): Observable<TResponse> {
    // Use native Supabase functions.invoke() - it handles:
    // - JSON serialization (pass body directly, not stringified)
    // - Auth headers (automatically from session)
    // - Type safety (TRequest/TResponse)
    return from(
      this.supabaseClient.client.functions.invoke<TResponse>(functionName, {
        body: body as any, // Type assertion needed for Supabase's flexible body type
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          // Map Supabase function errors to domain errors
          throw this.mapFunctionError(error);
        }

        if (!data) {
          throw mapHttpErrorToDomainError(500, { message: 'No data returned from function' });
        }

        return data;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Map Supabase function errors to domain errors
   */
  private mapFunctionError(error: FunctionsHttpError | FunctionsRelayError | FunctionsFetchError) {
    // FunctionsHttpError: HTTP error from the function (status code available)
    if ('context' in error && typeof error.context === 'object' && error.context !== null && 'status' in error.context) {
      const status = error.context.status as number;
      return mapHttpErrorToDomainError(status, { message: error.message });
    }

    // FunctionsRelayError: Error from the Edge Functions relay
    // FunctionsFetchError: Network/fetch error
    return mapHttpErrorToDomainError(500, { message: error.message || 'Edge Function error' });
  }
}

