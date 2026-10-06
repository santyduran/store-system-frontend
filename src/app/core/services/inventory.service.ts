import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type InventoryMovementType =
  | 'IN'
  | 'OUT'
  | 'ADJUSTMENT';

export interface InventoryMovement {
  _id: string;
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryMovement {
  productId: string;
  type: InventoryMovementType;
  quantity: number;
  reason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  createMovement(
    movement: CreateInventoryMovement,
  ): Observable<InventoryMovement> {
    return this.http.post<InventoryMovement>(
      `${this.apiUrl}/inventory/movements`,
      movement,
    );
  }

  findAll(): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(
      `${this.apiUrl}/inventory/movements`,
    );
  }
}