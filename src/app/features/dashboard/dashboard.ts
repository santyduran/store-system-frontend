
import {
  Component,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';

import {
  DecimalPipe,
  isPlatformBrowser,
} from '@angular/common';

import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  Auth,
} from '../../core/services/auth';

interface SalesReport {
  totalSales: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  averageSale: number;
  cashAmount: number;
  cardAmount: number;
  transferAmount: number;
}

interface InventoryReport {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
}

@Component({
  selector: 'app-dashboard',

  imports: [
    RouterLink,
    DecimalPipe,
  ],

  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  isAdmin =
    signal(false);

  totalSales =
    signal(0);

  totalSalesAmount =
    signal(0);

  averageSale =
    signal(0);

  totalProducts =
    signal(0);

  lowStockProducts =
    signal(0);

  loadingStats =
    signal(true);

  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly apiUrl =
    'http://localhost:3000/reports';

  constructor(
    private readonly authService:
      Auth,

    private readonly router:
      Router,

    private readonly http:
      HttpClient,
  ) {
    if (
      isPlatformBrowser(
        this.platformId,
      )
    ) {
      this.isAdmin.set(
        localStorage.getItem(
          'userRole',
        ) === 'ADMIN',
      );

      this.loadDashboardStats();
    }
  }

  private getColombiaToday(): string {
    const parts = new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
    ).formatToParts(new Date());

    const year = parts.find(
      (part) => part.type === 'year',
    )?.value;

    const month = parts.find(
      (part) => part.type === 'month',
    )?.value;

    const day = parts.find(
      (part) => part.type === 'day',
    )?.value;

    return `${year}-${month}-${day}`;
  }

  private loadDashboardStats(): void {
    this.loadingStats.set(true);

    const today = this.getColombiaToday();

    const salesParams = new HttpParams()
      .set('startDate', today)
      .set('endDate', today);

    this.http
      .get<SalesReport>(
        `${this.apiUrl}/sales`,
        {
          params: salesParams,
        },
      )
      .subscribe({
        next: (response) => {
          this.totalSales.set(
            response.totalSales,
          );

          this.totalSalesAmount.set(
            response.totalAmount,
          );

          this.averageSale.set(
            response.averageSale,
          );

          this.loadingStats.set(false);
        },

        error: (error) => {
          console.error(
            '[DASHBOARD] Error cargando ventas:',
            error,
          );

          this.loadingStats.set(false);
        },
      });

    this.http
      .get<InventoryReport>(
        `${this.apiUrl}/inventory`,
      )
      .subscribe({
        next: (response) => {
          this.totalProducts.set(
            response.totalProducts,
          );

          this.lowStockProducts.set(
            response.lowStockProducts,
          );
        },

        error: (error) => {
          console.error(
            '[DASHBOARD] Error cargando inventario:',
            error,
          );
        },
      });
  }

  logout(): void {
    this.authService.logout();

    this.router.navigate([
      '/login',
    ]);
  }
}
