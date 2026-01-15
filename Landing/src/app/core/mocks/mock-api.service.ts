import { Injectable } from '@angular/core';
import { defer, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { MockErrorService } from './mock-error.service';

@Injectable({ providedIn: 'root' })
export class MockApiService {
  constructor(private readonly errors: MockErrorService) {}

  simulate<T>(value: T, options?: { delayMs?: number; failureKey?: string }): Observable<T> {
    const delayMs = options?.delayMs ?? 300 + Math.floor(Math.random() * 300);
    const shouldFail = this.errors.shouldFail(options?.failureKey);

    return defer(() => {
      if (shouldFail) {
        return throwError(() => new Error('Mock request failed'));
      }
      return of(value);
    }).pipe(delay(delayMs));
  }

  simulateError(message: string, options?: { delayMs?: number }): Observable<never> {
    const delayMs = options?.delayMs ?? 300 + Math.floor(Math.random() * 300);
    return defer(() => throwError(() => new Error(message))).pipe(delay(delayMs));
  }
}
