import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Provider {
  _id?: string;
  businessName: string;
  nit: string;
  verificationDigit: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountType?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProvidersService {
  private readonly apiUrl = 'http://localhost:3000/providers';

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<Provider[]> {
    return this.http.get<Provider[]>(this.apiUrl);
  }

  findActive(): Observable<Provider[]> {
    return this.http.get<Provider[]>(`${this.apiUrl}/active`);
  }

  findOne(id: string): Observable<Provider> {
    return this.http.get<Provider>(`${this.apiUrl}/${id}`);
  }

  create(provider: Provider): Observable<Provider> {
    return this.http.post<Provider>(this.apiUrl, provider);
  }

  update(id: string, provider: Partial<Provider>): Observable<Provider> {
    return this.http.patch<Provider>(`${this.apiUrl}/${id}`, provider);
  }

  remove(id: string): Observable<Provider> {
    return this.http.delete<Provider>(`${this.apiUrl}/${id}`);
  }
}