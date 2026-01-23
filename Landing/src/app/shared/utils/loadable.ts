import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { DomainError, DomainErrorType } from '../../core/types/domain-error';

export type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export interface Loadable<T> {
  state: LoadState;
  data?: T;
  error?: string;
  errorType?: DomainErrorType;  // For type-specific error handling
  errorReason?: string;          // For reason-specific messaging (e.g., DOMAIN_ALREADY_EXISTS)
}

/**
 * Wraps an Observable in a Loadable state pattern
 *
 * @param source - Source observable to wrap
 * @param isEmpty - Optional function to determine if data represents empty state
 * @returns Observable of Loadable<T> with loading, ready, empty, or error states
 */
export const toLoadable = <T>(
  source: Observable<T>,
  isEmpty?: (data: T) => boolean
): Observable<Loadable<T>> =>
  source.pipe(
    map(data => {
      const empty = isEmpty ? isEmpty(data) : data === null || data === undefined;
      return empty ? { state: 'empty' as const, data } : { state: 'ready' as const, data };
    }),
    startWith<Loadable<T>>({ state: 'loading' }),
    catchError(error => {
      // Preserve DomainError details for UI
      const domainError = error instanceof DomainError ? error : null;
      return of<Loadable<T>>({
        state: 'error',
        error: error instanceof Error ? error.message : 'Unexpected error',
        errorType: domainError?.type,
        errorReason: domainError?.reason,  // Propagate reason codes
      });
    })
  );
