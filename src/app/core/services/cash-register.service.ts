import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type CashRegisterStatus = 'OPEN' | 'CLOSED';

export type CashMovementType =
  | 'OPENING'
  | 'SALE'
  | 'SALE_CANCELLATION'
  | 'CASH_ENTRY'
  | 'CASH_EXIT';

export type CashMovementDirection = 'IN' | 'OUT';

export interface CashRegister {
  _id: string;
  userId: string;
  openingAmount: number;
  openingDate: string;
  closingDate?: string;
  expectedCash: number;
  countedCash?: number;
  difference?: number;
  status: CashRegisterStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OpenCashRegister {
  openingAmount: number;
}

export interface CloseCashRegister {
  countedCash: number;
}

export interface CreateCashEntry {
  amount: number;
  description: string;
}

export interface CreateCashExit {
  amount: number;
  description: string;
}

export interface CashMovementUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface CashMovement {
  _id: string;
  cashRegisterId: string;
  userId: string | CashMovementUser;
  type: CashMovementType;
  movementType: CashMovementDirection;
  amount: number;
  saleId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CashRegisterService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  open(
    cashRegister: OpenCashRegister,
  ): Observable<CashRegister> {
    return this.http.post<CashRegister>(
      `${this.apiUrl}/cash-register/open`,
      cashRegister,
    );
  }

  getCurrent(): Observable<CashRegister> {
    return this.http.get<CashRegister>(
      `${this.apiUrl}/cash-register/current`,
    );
  }

  getLatest(): Observable<CashRegister> {
    return this.http.get<CashRegister>(
      `${this.apiUrl}/cash-register/latest`,
    );
  }

  getMovements(): Observable<CashMovement[]> {
    return this.http.get<CashMovement[]>(
      `${this.apiUrl}/cash-register/movements`,
    );
  }

  createCashEntry(
    cashEntry: CreateCashEntry,
  ): Observable<CashRegister> {
    return this.http.post<CashRegister>(
      `${this.apiUrl}/cash-register/entry`,
      cashEntry,
    );
  }

  createCashExit(
    cashExit: CreateCashExit,
  ): Observable<CashRegister> {
    return this.http.post<CashRegister>(
      `${this.apiUrl}/cash-register/exit`,
      cashExit,
    );
  }

  close(
    cashRegister: CloseCashRegister,
  ): Observable<CashRegister> {
    return this.http.post<CashRegister>(
      `${this.apiUrl}/cash-register/close`,
      cashRegister,
    );
  }
}