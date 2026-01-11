import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

export type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export interface Loadable<T> {
  state: LoadState;
  data?: T;
  error?: string;
}

export const toLoadable = <T>(
  source: Observable<T>,
  isEmpty?: (data: T) => boolean
): Observable<Loadable<T>> =>
  source.pipe(
    map(data => {
      const empty = isEmpty ? isEmpty(data) : data === null || data === undefined;
      return empty ? { state: 'empty', data } : { state: 'ready', data };
    }),
    startWith<Loadable<T>>({ state: 'loading' }),
    catchError(error =>
      of<Loadable<T>>({
        state: 'error',
        error: error instanceof Error ? error.message : 'Unexpected error',
      })
    )
  );
