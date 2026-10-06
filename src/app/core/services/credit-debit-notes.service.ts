import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable, map } from 'rxjs';

export type CreditNoteStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'CANCELLED';

export type DebitNoteStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'CANCELLED';

export interface CreditDebitNoteItem {
  _id: string;
  creditNoteId?: string;
  debitNoteId?: string;

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

export interface CreditNote {
  _id: string;

  invoiceId: string | {
    _id: string;
    invoiceNumber: string;
    prefix?: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    status:
      | 'DRAFT'
      | 'GENERATED'
      | 'SENT'
      | 'VALIDATED'
      | 'REJECTED'
      | 'CANCELLED';
  };

  creditNoteNumber: string;
  prefix: string;
  issueDate: string;
  reason: string;

  subtotal: number;
  taxTotal: number;
  total: number;

  status: CreditNoteStatus;

  createdBy: string | {
    _id: string;
    name?: string;
    email?: string;
  };

  cancelledAt?: string;

  cancelledBy?: string | {
    _id: string;
    name?: string;
    email?: string;
  };

  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DebitNote {
  _id: string;

  invoiceId: string | {
    _id: string;
    invoiceNumber: string;
    prefix?: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    status:
      | 'DRAFT'
      | 'GENERATED'
      | 'SENT'
      | 'VALIDATED'
      | 'REJECTED'
      | 'CANCELLED';
  };

  debitNoteNumber: string;
  prefix: string;
  issueDate: string;
  reason: string;

  subtotal: number;
  taxTotal: number;
  total: number;

  status: DebitNoteStatus;

  createdBy: string | {
    _id: string;
    name?: string;
    email?: string;
  };

  cancelledAt?: string;

  cancelledBy?: string | {
    _id: string;
    name?: string;
    email?: string;
  };

  cancellationReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteDetail extends CreditNote {
  items: CreditDebitNoteItem[];
}

export interface DebitNoteDetail extends DebitNote {
  items: CreditDebitNoteItem[];
}

interface CreditNoteDetailResponse {
  creditNote: CreditNote;
  items: CreditDebitNoteItem[];
}

interface DebitNoteDetailResponse {
  debitNote: DebitNote;
  items: CreditDebitNoteItem[];
}

export interface CreateCreditNoteItem {
  productId: string;
  quantity: number;
}

export interface CreateCreditNote {
  invoiceId: string;
  reason: string;
  items: CreateCreditNoteItem[];
}

export interface CreateDebitNoteItem {
  productId: string;
  quantity: number;
}

export interface CreateDebitNote {
  invoiceId: string;
  reason: string;
  items: CreateDebitNoteItem[];
}

export interface CancelNoteRequest {
  cancellationReason: string;
}

@Injectable({
  providedIn: 'root',
})
export class CreditDebitNotesService {
  private readonly apiUrl =
    'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  createCreditNote(
    creditNote: CreateCreditNote,
  ): Observable<CreditNote> {
    return this.http.post<CreditNote>(
      `${this.apiUrl}/credit-notes`,
      creditNote,
    );
  }

  findCreditNotes(): Observable<CreditNote[]> {
    return this.http.get<CreditNote[]>(
      `${this.apiUrl}/credit-notes`,
    );
  }

  findCreditNote(
    id: string,
  ): Observable<CreditNoteDetail> {
    return this.http
      .get<CreditNoteDetailResponse>(
        `${this.apiUrl}/credit-notes/${id}`,
      )
      .pipe(
        map((response) => ({
          ...response.creditNote,
          items: response.items,
        })),
      );
  }

  cancelCreditNote(
    id: string,
    cancellationReason: string,
  ): Observable<CreditNote> {
    return this.http.patch<CreditNote>(
      `${this.apiUrl}/credit-notes/${id}/cancel`,
      {
        cancellationReason,
      },
    );
  }

  createDebitNote(
    debitNote: CreateDebitNote,
  ): Observable<DebitNote> {
    return this.http.post<DebitNote>(
      `${this.apiUrl}/debit-notes`,
      debitNote,
    );
  }

  findDebitNotes(): Observable<DebitNote[]> {
    return this.http.get<DebitNote[]>(
      `${this.apiUrl}/debit-notes`,
    );
  }

  findDebitNote(
    id: string,
  ): Observable<DebitNoteDetail> {
    return this.http
      .get<DebitNoteDetailResponse>(
        `${this.apiUrl}/debit-notes/${id}`,
      )
      .pipe(
        map((response) => ({
          ...response.debitNote,
          items: response.items,
        })),
      );
  }

  cancelDebitNote(
    id: string,
    cancellationReason: string,
  ): Observable<DebitNote> {
    return this.http.patch<DebitNote>(
      `${this.apiUrl}/debit-notes/${id}/cancel`,
      {
        cancellationReason,
      },
    );
  }
}