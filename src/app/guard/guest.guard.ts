import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalstorageService } from './ssr/localstorage/localstorage.service';
export const guestGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const ssrStorage = inject(LocalstorageService)
  const isLoggedIn = ssrStorage.getItem('token');
  console.log("##################### GUEST GARD EXECUTE #################");
  if (isLoggedIn) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};
