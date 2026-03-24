import { Routes } from '@angular/router';
// import { authGuard } from './guards/auth.guard';
// implementar após criar a página de login
import { HomePage } from './pages/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    //  canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
