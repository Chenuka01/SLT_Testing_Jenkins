import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userId = localStorage.getItem('user_id');

  if (userId) {
    return true;
  }

  // Redirect to login if not logged in
  router.navigate(['/login']);
  return false;
};
