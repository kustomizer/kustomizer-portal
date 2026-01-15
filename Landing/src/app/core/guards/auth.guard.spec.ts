import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { provideMockRepositories } from '../providers/app-providers';
import { AuthFacade } from '../facades/auth.facade';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ...provideMockRepositories(), AuthFacade],
    });
    localStorage.clear();
  });

  it('redirects to login when no session', async () => {
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any))
    );
    expect(result).toBeInstanceOf(UrlTree);
  });
});
