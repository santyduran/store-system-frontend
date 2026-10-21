
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SupplierInvoiceStatus =
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type SupplierInvoicePaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER';

export interface SupplierInvoiceProvider {
  _id: string;
  businessName: string;
  nit: string;
  verificationDigit?: string;
  contactName?: string;
  phone?: string;
  email?: string;
}

export interface SupplierInvoicePurchase {
  _id: string;
  purchaseNumber: string;
  status: string;
  orderDate?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
}

export interface SupplierInvoiceAttachment {
  fileName: string;
  mimeType: string;
  fileUrl: string;
  storedFileName?: string;
  fileSize: number;
  uploadedAt: string;
}

export interface SupplierInvoice {
  _id: string;
  invoiceNumber: string;
  providerId: string | SupplierInvoiceProvider;
  purchaseId: string | SupplierInvoicePurchase;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  status: SupplierInvoiceStatus;
  paymentMethod?: SupplierInvoicePaymentMethod;
  paymentDate?: string;
  observations?: string;
  supplierInvoiceNumber?: string;
  authorizationNumber?: string;
  attachment?: SupplierInvoiceAttachment | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoicePayableSummary {
  pending: {
    count: number;
    total: number;
  };
  overdue: {
    count: number;
    total: number;
  };
  paid: {
    count: number;
    total: number;
  };
  outstandingCount: number;
  outstandingTotal: number;
}

export interface PaySupplierInvoicePayload {
  paymentMethod: SupplierInvoicePaymentMethod;
  paymentDate?: string;
  observations?: string;
}

export interface SupplierInvoiceAttachmentResponse {
  message: string;
  attachment: SupplierInvoiceAttachment;
}

@Injectable({
  providedIn: 'root',
})
export class SupplierInvoicesService {
  private readonly apiUrl = 'http://localhost:3000/supplier-invoices';

  constructor(
    private readonly http: HttpClient,
  ) {}

  findAll(): Observable<SupplierInvoice[]> {
    return this.http.get<SupplierInvoice[]>(this.apiUrl);
  }

  findOne(id: string): Observable<SupplierInvoice> {
    return this.http.get<SupplierInvoice>(
      `${this.apiUrl}/${id}`,
    );
  }

  findPendingPayables(): Observable<SupplierInvoice[]> {
    return this.http.get<SupplierInvoice[]>(
      `${this.apiUrl}/payables/pending`,
    );
  }

  findOverduePayables(): Observable<SupplierInvoice[]> {
    return this.http.get<SupplierInvoice[]>(
      `${this.apiUrl}/payables/overdue`,
    );
  }

  findPaidPayables(): Observable<SupplierInvoice[]> {
    return this.http.get<SupplierInvoice[]>(
      `${this.apiUrl}/payables/paid`,
    );
  }

  getPayablesSummary(): Observable<SupplierInvoicePayableSummary> {
    return this.http.get<SupplierInvoicePayableSummary>(
      `${this.apiUrl}/payables/summary`,
    );
  }

  pay(
    id: string,
    payload: PaySupplierInvoicePayload,
  ): Observable<SupplierInvoice> {
    return this.http.post<SupplierInvoice>(
      `${this.apiUrl}/${id}/pay`,
      payload,
    );
  }

  uploadAttachment(
    invoiceId: string,
    file: File,
  ): Observable<SupplierInvoiceAttachmentResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<SupplierInvoiceAttachmentResponse>(
      `${this.apiUrl}/${invoiceId}/attachment`,
      formData,
    );
  }

  getAttachmentUrl(invoiceId: string): string {
    return `${this.apiUrl}/${invoiceId}/attachment`;
  }
}
