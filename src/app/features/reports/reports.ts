import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import {
  DecimalPipe,
  isPlatformBrowser,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import {
  PLATFORM_ID,
  inject,
} from '@angular/core';

interface SalesReport {
  totalSales: number;
  subtotalAmount: number;
  taxAmount: number;
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

interface LowStockProduct {
  name: string;
  sku?: string;
  barcode?: string;
  stock: number;
  minStock: number;
  difference: number;
}

interface LowStockReport {
  totalLowStockProducts: number;
  products: LowStockProduct[];
}

interface InventoryValueReport {
  purchaseValue: number;
  saleValue: number;
  potentialMargin: number;
}

interface BestSellingProduct {
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  quantitySold: number;
  totalAmount: number;
}

interface BestSellingProductsReport {
  totalProductsSold: number;
  products: BestSellingProduct[];
}

@Component({
  selector: 'app-reports',
  host: {
    ngSkipHydration: 'true',
  },
  imports: [
    FormsModule,
    DecimalPipe,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly apiUrl =
    'http://localhost:3000/reports';

  private readonly platformId =
    inject(PLATFORM_ID);

  salesReport: SalesReport | null = null;

  inventoryReport:
    | InventoryReport
    | null = null;

  lowStockReport:
    | LowStockReport
    | null = null;

  inventoryValueReport:
    | InventoryValueReport
    | null = null;

  bestSellingProductsReport:
    | BestSellingProductsReport
    | null = null;

  startDate = '';

  endDate = '';

  loading = false;

  errorMessage = '';

  private pendingRequests = 0;

  constructor(
    private readonly http: HttpClient,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      this.loading = false;
      return;
    }

    this.loadReports();
  }

  loadReports(): void {
    this.loading = true;
    this.errorMessage = '';

    this.salesReport = null;
    this.inventoryReport = null;
    this.lowStockReport = null;
    this.inventoryValueReport = null;
    this.bestSellingProductsReport = null;

    this.pendingRequests = 5;

    this.loadSalesReport();
    this.loadInventoryReport();
    this.loadLowStockReport();
    this.loadInventoryValueReport();
    this.loadBestSellingProductsReport();
  }

  loadSalesReport(): void {
    const params =
      this.createDateParams();

    this.http
      .get<SalesReport>(
        `${this.apiUrl}/sales`,
        { params },
      )
      .subscribe({
        next: (response) => {
          this.salesReport = response;
          this.finishRequest();
        },
        error: () => {
          this.setError(
            'No fue posible cargar el reporte de ventas.',
          );
          this.finishRequest();
        },
      });
  }

  loadInventoryReport(): void {
    this.http
      .get<InventoryReport>(
        `${this.apiUrl}/inventory`,
      )
      .subscribe({
        next: (response) => {
          this.inventoryReport = response;
          this.finishRequest();
        },
        error: () => {
          this.setError(
            'No fue posible cargar el reporte de inventario.',
          );
          this.finishRequest();
        },
      });
  }

  loadLowStockReport(): void {
    this.http
      .get<LowStockReport>(
        `${this.apiUrl}/low-stock`,
      )
      .subscribe({
        next: (response) => {
          this.lowStockReport = response;
          this.finishRequest();
        },
        error: () => {
          this.setError(
            'No fue posible cargar el reporte de stock bajo.',
          );
          this.finishRequest();
        },
      });
  }

  loadInventoryValueReport(): void {
    this.http
      .get<InventoryValueReport>(
        `${this.apiUrl}/inventory-value`,
      )
      .subscribe({
        next: (response) => {
          this.inventoryValueReport =
            response;
          this.finishRequest();
        },
        error: () => {
          this.setError(
            'No fue posible cargar el valor del inventario.',
          );
          this.finishRequest();
        },
      });
  }

  loadBestSellingProductsReport(): void {
    const params =
      this.createDateParams();

    this.http
      .get<BestSellingProductsReport>(
        `${this.apiUrl}/best-selling-products`,
        { params },
      )
      .subscribe({
        next: (response) => {
          this.bestSellingProductsReport =
            response;
          this.finishRequest();
        },
        error: () => {
          this.setError(
            'No fue posible cargar los productos más vendidos.',
          );
          this.finishRequest();
        },
      });
  }

  applyFilters(): void {
    this.loadReports();
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';

    this.loadReports();
  }

  private createDateParams(): HttpParams {
    let params = new HttpParams();

    if (this.startDate) {
      params = params.set(
        'startDate',
        this.startDate,
      );
    }

    if (this.endDate) {
      params = params.set(
        'endDate',
        this.endDate,
      );
    }

    return params;
  }

  private finishRequest(): void {
    this.pendingRequests--;

    if (this.pendingRequests <= 0) {
      this.loading = false;
    }

    this.changeDetectorRef.detectChanges();
  }

  private setError(
    message: string,
  ): void {
    if (!this.errorMessage) {
      this.errorMessage = message;
    }
  }
}