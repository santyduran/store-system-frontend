import { Injectable } from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER';

export interface CreateSaleItem {
  productId: string;
  quantity: number;
}

export interface CreateSale {
  items: CreateSaleItem[];
  customerId?: string;
  discount?: number;
  paymentMethod: PaymentMethod;
}

export interface PendingSaleItem {
  productId:
    | string
    | {
        _id: string;
        name: string;
        barcode?: string;
        sku?: string;
        brand?: string;
        salePrice?: number;
        taxRate?: number;
        stock?: number;
        status?: string;
      };

  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface PendingSale {
  _id: string;
  pendingNumber: string;

  userId:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        role?: string;
      };

  customerId?:
    | string
    | SaleCustomer
    | null;

  items: PendingSaleItem[];

  discount: number;

  status:
    | 'PENDING'
    | 'COMPLETED'
    | 'CANCELLED';

  createdAt: string;
  updatedAt: string;
}

export interface CreatePendingSale {
  items: CreateSaleItem[];
  customerId?: string;
  discount?: number;
}

export interface UpdatePendingSale {
  items: CreateSaleItem[];
  customerId?: string;
  discount?: number;
}

export interface CompletePendingSale {
  paymentMethod: PaymentMethod;
}

export interface SaleCustomer {
  _id: string;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface Sale {
  _id: string;
  saleNumber: string;
  userId: string;

  customerId?: SaleCustomer | null;

  subtotal: number;
  discount: number;
  tax?: number;
  total: number;

  paymentMethod: PaymentMethod;

  status:
    | 'PENDING'
    | 'COMPLETED'
    | 'CANCELLED';

  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly apiUrl =
    'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  create(
    sale: CreateSale,
  ): Observable<Sale> {
    return this.http.post<Sale>(
      `${this.apiUrl}/sales`,
      sale,
    );
  }

  createPending(
    sale: CreatePendingSale,
  ): Observable<PendingSale> {
    return this.http.post<PendingSale>(
      `${this.apiUrl}/sales/pending`,
      sale,
    );
  }

  findPending(): Observable<PendingSale[]> {
    return this.http.get<PendingSale[]>(
      `${this.apiUrl}/sales/pending`,
    );
  }

  findPendingOne(
    id: string,
  ): Observable<PendingSale> {
    return this.http.get<PendingSale>(
      `${this.apiUrl}/sales/pending/${id}`,
    );
  }

  updatePending(
    id: string,
    data: UpdatePendingSale,
  ): Observable<PendingSale> {
    return this.http.patch<PendingSale>(
      `${this.apiUrl}/sales/pending/${id}`,
      data,
    );
  }

  completePending(
    id: string,
    data: CompletePendingSale,
  ): Observable<Sale> {
    return this.http.post<Sale>(
      `${this.apiUrl}/sales/pending/${id}/complete`,
      data,
    );
  }

  cancelPending(
    id: string,
  ): Observable<PendingSale> {
    return this.http.patch<PendingSale>(
      `${this.apiUrl}/sales/pending/${id}/cancel`,
      {},
    );
  }

  findAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(
      `${this.apiUrl}/sales`,
    );
  }

  findOne(
    id: string,
  ): Observable<{
    sale: Sale;
    items: unknown[];
  }> {
    return this.http.get<{
      sale: Sale;
      items: unknown[];
    }>(
      `${this.apiUrl}/sales/${id}`,
    );
  }

  cancel(
    id: string,
    cancellationReason?: string,
  ): Observable<Sale> {
    return this.http.patch<Sale>(
      `${this.apiUrl}/sales/${id}/cancel`,
      {
        cancellationReason,
      },
    );
  }
}