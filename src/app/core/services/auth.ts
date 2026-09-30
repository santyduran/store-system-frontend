import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import {
  Observable,
  tap,
} from 'rxjs';

interface LoginResponse {
  accessToken: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly apiUrl =
    'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  login(
    email: string,
    password: string,
  ): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/auth/login`,
        {
          email,
          password,
        },
      )
      .pipe(
        tap((response) => {
          localStorage.setItem(
            'accessToken',
            response.accessToken,
          );

          localStorage.setItem(
            'userRole',
            response.user.role,
          );
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(
      'accessToken',
    );

    localStorage.removeItem(
      'userRole',
    );
  }
}