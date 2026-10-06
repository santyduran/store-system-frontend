import { Injectable } from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

export type CustomerDocumentType =
  | 'CC'
  | 'CE'
  | 'NIT'
  | 'PASSPORT'
  | 'OTHER';

export type CustomerStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export interface Customer {
  _id: string;
  documentType: CustomerDocumentType;
  documentNumber: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomer {
  documentType: CustomerDocumentType;
  documentNumber: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface UpdateCustomer {
  documentType?: CustomerDocumentType;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status?: CustomerStatus;
}

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  private readonly apiUrl =
    'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  findAll(): Observable<Customer[]> {
    return this.http.get<Customer[]>(
      `${this.apiUrl}/customers`,
    );
  }

  findActive(): Observable<Customer[]> {
    return this.http.get<Customer[]>(
      `${this.apiUrl}/customers/active`,
    );
  }

  findOne(
    id: string,
  ): Observable<Customer> {
    return this.http.get<Customer>(
      `${this.apiUrl}/customers/${id}`,
    );
  }

  create(
    customer: CreateCustomer,
  ): Observable<Customer> {
    return this.http.post<Customer>(
      `${this.apiUrl}/customers`,
      customer,
    );
  }

  update(
    id: string,
    customer: UpdateCustomer,
  ): Observable<Customer> {
    return this.http.put<Customer>(
      `${this.apiUrl}/customers/${id}`,
      customer,
    );
  }

  remove(
    id: string,
  ): Observable<Customer> {
    return this.http.delete<Customer>(
      `${this.apiUrl}/customers/${id}`,
      );
  }
}