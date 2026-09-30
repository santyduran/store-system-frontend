import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  PLATFORM_ID,
  inject,
} from '@angular/core';

import {
  isPlatformBrowser,
} from '@angular/common';

export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const accessToken =
    localStorage.getItem('accessToken');

  if (accessToken) {
    return true;
  }

  return router.createUrlTree(['/login']);
};