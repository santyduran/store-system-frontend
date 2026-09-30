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
  discount?: number;
  paymentMethod: PaymentMethod;
}

export interface Sale {
  _id: string;
  saleNumber: string;
  userId: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: 'COMPLETED' | 'CANCELLED';
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