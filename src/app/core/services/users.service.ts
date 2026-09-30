import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

export type UserRole =
  | 'ADMIN'
  | 'CASHIER';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUser {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUser {
  name?: string;
  email?: string;
  role?: UserRole;
}

export interface UpdateUserStatus {
  status: UserStatus;
}

export interface UpdateUserPassword {
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly apiUrl =
    'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  create(
    user: CreateUser,
  ): Observable<User> {
    return this.http.post<User>(
      `${this.apiUrl}/users`,
      user,
    );
  }

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}/users`,
    );
  }

  findOne(
    id: string,
  ): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/users/${id}`,
    );
  }

  update(
    id: string,
    user: UpdateUser,
  ): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/users/${id}`,
      user,
    );
  }

  updateStatus(
    id: string,
    status: UserStatus,
  ): Observable<User> {
    const data: UpdateUserStatus = {
      status,
    };

    return this.http.patch<User>(
      `${this.apiUrl}/users/${id}/status`,
      data,
    );
  }

  updatePassword(
    id: string,
    password: string,
  ): Observable<User> {
    const data: UpdateUserPassword = {
      password,
    };

    return this.http.patch<User>(
      `${this.apiUrl}/users/${id}/password`,
      data,
    );
  }
}