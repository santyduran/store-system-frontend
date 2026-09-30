import {
  Injectable,
} from '@angular/core';

import {
  HttpBackend,
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

interface PasswordRecoveryResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PasswordRecoveryService {
  private readonly apiUrl =
    'http://localhost:3000';

  private readonly http: HttpClient;

  constructor(
    httpBackend: HttpBackend,
  ) {
    this.http =
      new HttpClient(
        httpBackend,
      );
  }

  forgotPassword(
    email: string,
  ): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(
      `${this.apiUrl}/auth/forgot-password`,
      {
        email,
      },
    );
  }

  resetPassword(
    token: string,
    password: string,
  ): Observable<PasswordRecoveryResponse> {
    return this.http.post<PasswordRecoveryResponse>(
      `${this.apiUrl}/auth/reset-password`,
      {
        token,
        password,
      },
    );
  }
}