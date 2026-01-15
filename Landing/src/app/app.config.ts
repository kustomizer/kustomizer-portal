import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideProductionRepositories } from './core/providers/production-providers';
import { provideMockRepositories } from './core/providers/app-providers';
import { environment } from '../environment/environment';

// Use production repositories by default, mock for testing
const repositoryProviders = environment.production
  ? provideProductionRepositories()
  : provideProductionRepositories(); // Change to provideMockRepositories() for testing

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), ...repositoryProviders],
};
