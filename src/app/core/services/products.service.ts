import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  barcode: string;
  brand?: string;
  attributes?: Record<string, unknown>;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  taxRate?: number;
  category: {
    _id: string;
    name: string;
    description?: string;
    status: string;
  };
  provider?: {
    _id: string;
    businessName: string;
    nit?: string;
  } | string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  findAll(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}/products`,
    );
  }

  findByProvider(
    providerId: string,
  ): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}/products/by-provider/${providerId}`,
    );
  }

  search(
    term: string,
  ): Observable<Product[]> {
    const params =
      new HttpParams().set(
        'term',
        term,
      );

    return this.http.get<Product[]>(
      `${this.apiUrl}/products/search`,
      { params },
    );
  }

  findOne(id: string): Observable<Product> {
    return this.http.get<Product>(
      `${this.apiUrl}/products/${id}`,
    );
  }

  create(product: {
    barcode: string;
    sku: string;
    name: string;
    brand?: string;
    categoryId: string;
    providerId?: string | null;
    description?: string;
    purchasePrice: number;
    salePrice: number;
    stock: number;
    minStock: number;
    taxRate?: number;
    attributes?: Record<string, unknown>;
  }): Observable<Product> {
    return this.http.post<Product>(
      `${this.apiUrl}/products`,
      product,
    );
  }

  update(
    id: string,
    product: {
      barcode?: string;
      sku?: string;
      name?: string;
      brand?: string;
      categoryId?: string;
      providerId?: string | null;
      description?: string;
      purchasePrice?: number;
      salePrice?: number;
      stock?: number;
      minStock?: number;
      taxRate?: number;
      attributes?: Record<string, unknown>;
      status?: 'ACTIVE' | 'INACTIVE';
    },
  ): Observable<Product> {
    return this.http.put<Product>(
      `${this.apiUrl}/products/${id}`,
      product,
    );
  }

  remove(id: string): Observable<Product> {
    return this.http.delete<Product>(
      `${this.apiUrl}/products/${id}`,
    );
  }
}