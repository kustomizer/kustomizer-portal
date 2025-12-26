import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { UserListComponent } from './components/user-list/user-list.component';

export const routes: Routes = [
  {
    path: 'users',
    component: UserListComponent
  },
  {
    path: '',
    component: LandingComponent
  }
];
