import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { provideMockRepositories } from '../providers/app-providers';
import { AuthFacade } from '../facades/auth.facade';
import { adminGuard } from './admin.guard';
import { AUTH_REPOSITORY } from '../repositories';

describe('adminGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), ...provideMockRepositories(), AuthFacade],
    });
    localStorage.clear();
  });

  it('allows admin users', async () => {
    const authRepository = TestBed.inject(AUTH_REPOSITORY);
    await firstValueFrom(authRepository.login('user-3'));
    const result = await firstValueFrom(
      TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any))
    );
    expect(result).toBe(true);
  });
});
