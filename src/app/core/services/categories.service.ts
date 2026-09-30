import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(
    private readonly http: HttpClient,
  ) {}

  findAll(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/categories`,
    );
  }

  create(category: {
    name: string;
    description?: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/categories`,
      category,
    );
  }

  update(
    id: string,
    category: {
      name: string;
      description?: string;
    },
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/categories/${id}`,
      category,
    );
  }

  remove(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/categories/${id}`,
    );
  }
}