import { Injectable } from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

export type InvoiceStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'SENT'
  | 'VALIDATED'
  | 'REJECTED'
  | 'CANCELLED';

export type InvoicePaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER';

export type InvoiceCustomerDocumentType =
  | 'CC'
  | 'CE'
  | 'NIT'
  | 'PASSPORT'
  | 'OTHER';

export interface InvoiceCustomerData {
  documentType: InvoiceCustomerDocumentType;
  documentNumber: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

export interface Invoice {
  _id: string;
  saleId: string | {
    _id: string;
    saleNumber: string;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: InvoicePaymentMethod;
    status: 'COMPLETED' | 'CANCELLED';
  };
  customerId?: string | {
    _id: string;
    documentType: string;
    documentNumber: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    status: 'ACTIVE' | 'INACTIVE';
  };
  invoiceNumber: string;
  prefix?: string;
  authorizationNumber?: string;
  authorizationDate?: string;
  authorizationRangeFrom?: number;
  authorizationRangeTo?: number;
  issueDate: string;
  issuer: {
    storeName: string;
    legalName?: string;
    nit?: string;
    dv?: string;
    phone?: string;
    address?: string;
    city?: string;
    department?: string;
    email?: string;
    economicActivity?: string;
  };
  subtotal: number;
  discount: number;
  taxTotal: number;
  total: number;
  paymentMethod: InvoicePaymentMethod;
  status: InvoiceStatus;
  uuid?: string;
  cufe?: string;
  qrCode?: string;
  xml?: string;
  dianResponse?: string;
  providerResponse?: string;
  validatedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  _id: string;
  invoiceId: string;
  productId: string | {
    _id: string;
    name: string;
    sku?: string;
    barcode?: string;
    salePrice: number;
    taxRate: number;
  };
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetail
  extends Invoice {
  items: InvoiceItem[];
}

export interface CreateInvoice {
  saleId: string;
  prefix?: string;
  invoiceNumber?: string;
  customer?: InvoiceCustomerData;
}

@Injectable({
  providedIn: 'root',
})
export class InvoicesService {
  private readonly apiUrl =
    'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  create(
    invoice: CreateInvoice,
  ): Observable<Invoice> {
    return this.http.post<Invoice>(
      `${this.apiUrl}/invoicing`,
      invoice,
    );
  }

  findAll(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(
      `${this.apiUrl}/invoicing`,
    );
  }

  findOne(
    id: string,
  ): Observable<InvoiceDetail> {
    return this.http.get<InvoiceDetail>(
      `${this.apiUrl}/invoicing/${id}`,
    );
  }

  getPdf(
    id: string,
  ): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/invoicing/${id}/pdf`,
      {
        responseType: 'blob',
      },
    );
  }

  getQr(
    id: string,
  ): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/invoicing/${id}/qr`,
      {
        responseType: 'blob',
      },
    );
  }

  cancel(
    id: string,
    cancellationReason?: string,
  ): Observable<Invoice> {
    return this.http.patch<Invoice>(
      `${this.apiUrl}/invoicing/${id}/cancel`,
      {
        cancellationReason,
      },
    );
  }
}