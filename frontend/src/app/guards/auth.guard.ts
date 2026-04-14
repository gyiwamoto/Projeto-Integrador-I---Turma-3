import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validarSessaoComCache().pipe(
    map((autenticado) => (autenticado ? true : router.createUrlTree(['/login']))),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};

export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validarSessao().pipe(
    map((autenticado) => (autenticado ? router.createUrlTree(['/dashboard']) : true)),
    catchError(() => of(true)),
  );
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.validarSessaoComCache().pipe(
    map((autenticado) =>
      autenticado && authService.ehAdmin() ? true : router.createUrlTree(['/dashboard']),
    ),
    catchError(() => of(router.createUrlTree(['/dashboard']))),
  );
};
