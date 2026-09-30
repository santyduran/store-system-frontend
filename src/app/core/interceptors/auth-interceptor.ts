import {
  HttpInterceptorFn,
} from '@angular/common/http';

import {
  PLATFORM_ID,
  inject,
} from '@angular/core';

import {
  isPlatformBrowser,
} from '@angular/common';

import {
  Router,
} from '@angular/router';

import {
  catchError,
  throwError,
} from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (
  req,
  next,
) => {
  const platformId =
    inject(PLATFORM_ID);

  if (
    !isPlatformBrowser(
      platformId,
    )
  ) {
    return next(req);
  }

  const router =
    inject(Router);

  const accessToken =
    localStorage.getItem(
      'accessToken',
    );

  if (!accessToken) {
    return next(req);
  }

  const authenticatedRequest =
    req.clone({
      setHeaders: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    });

  return next(
    authenticatedRequest,
  ).pipe(
    catchError((error) => {
      if (
        error?.status === 401
      ) {
        localStorage.removeItem(
          'accessToken',
        );

        localStorage.removeItem(
          'userRole',
        );

        router.navigate([
          '/login',
        ]);
      }

      return throwError(
        () => error,
      );
    }),
  );
};