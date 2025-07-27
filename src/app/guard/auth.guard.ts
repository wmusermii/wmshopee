import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalstorageService } from './ssr/localstorage/localstorage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const ssrStorage = inject(LocalstorageService)
  const isLoggedIn = ssrStorage.getItem('token');
  // console.log("GUARD - TOKEN ", isLoggedIn);
  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
