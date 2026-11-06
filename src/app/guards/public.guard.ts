import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estaLogueado()) {
    // Si ya está logueado, lo mandamos a su panel principal
    router.navigate(['/mis-incidencias']);
    return false;
  } else {
    return true;
  }
};
