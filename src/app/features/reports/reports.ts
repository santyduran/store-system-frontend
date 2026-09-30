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

  loading = true;

  errorMessage = '';

  constructor(
    private readonly http: HttpClient,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    console.log(
      '[REPORTS] ngOnInit ejecutado',
    );

    if (
      !isPlatformBrowser(
        this.platformId,
      )
    ) {
      console.log(
        '[REPORTS] SSR detectado. No se realizan peticiones.',
      );

      this.loading = false;

      return;
    }

    this.loadReports();
  }

  loadReports(): void {
    console.log(
      '[REPORTS] loadReports ejecutado',
    );

    this.loading = true;
    this.errorMessage = '';

    this.salesReport = null;
    this.inventoryReport = null;
    this.lowStockReport = null;
    this.inventoryValueReport = null;
    this.bestSellingProductsReport = null;

    this.loadSalesReport();
    this.loadInventoryReport();
    this.loadLowStockReport();
    this.loadInventoryValueReport();
    this.loadBestSellingProductsReport();
  }

  loadSalesReport(): void {
    console.log(
      '[REPORTS] Solicitando /sales',
    );

    const params =
      this.createDateParams();

    this.http
      .get<SalesReport>(
        `${this.apiUrl}/sales`,
        { params },
      )
      .subscribe({
        next: (response) => {
          console.log(
            '[REPORTS] /sales respondió:',
            response,
          );

          this.salesReport = response;
          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          console.error(
            '[REPORTS] Error en /sales:',
            error,
          );

          this.errorMessage =
            'No fue posible cargar el reporte de ventas.';

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  loadInventoryReport(): void {
    console.log(
      '[REPORTS] Solicitando /inventory',
    );

    this.http
      .get<InventoryReport>(
        `${this.apiUrl}/inventory`,
      )
      .subscribe({
        next: (response) => {
          console.log(
            '[REPORTS] /inventory respondió:',
            response,
          );

          this.inventoryReport = response;
          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          console.error(
            '[REPORTS] Error en /inventory:',
            error,
          );

          this.errorMessage =
            'No fue posible cargar el reporte de inventario.';

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  loadLowStockReport(): void {
    console.log(
      '[REPORTS] Solicitando /low-stock',
    );

    this.http
      .get<LowStockReport>(
        `${this.apiUrl}/low-stock`,
      )
      .subscribe({
        next: (response) => {
          console.log(
            '[REPORTS] /low-stock respondió:',
            response,
          );

          this.lowStockReport = response;
          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          console.error(
            '[REPORTS] Error en /low-stock:',
            error,
          );

          this.errorMessage =
            'No fue posible cargar el reporte de stock bajo.';

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  loadInventoryValueReport(): void {
    console.log(
      '[REPORTS] Solicitando /inventory-value',
    );

    this.http
      .get<InventoryValueReport>(
        `${this.apiUrl}/inventory-value`,
      )
      .subscribe({
        next: (response) => {
          console.log(
            '[REPORTS] /inventory-value respondió:',
            response,
          );

          this.inventoryValueReport =
            response;

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          console.error(
            '[REPORTS] Error en /inventory-value:',
            error,
          );

          this.errorMessage =
            'No fue posible cargar el valor del inventario.';

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  loadBestSellingProductsReport(): void {
    console.log(
      '[REPORTS] Solicitando /best-selling-products',
    );

    const params =
      this.createDateParams();

    this.http
      .get<BestSellingProductsReport>(
        `${this.apiUrl}/best-selling-products`,
        { params },
      )
      .subscribe({
        next: (response) => {
          console.log(
            '[REPORTS] /best-selling-products respondió:',
            response,
          );

          this.bestSellingProductsReport =
            response;

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          console.error(
            '[REPORTS] Error en /best-selling-products:',
            error,
          );

          this.errorMessage =
            'No fue posible cargar los productos más vendidos.';

          this.loading = false;

          this.changeDetectorRef.detectChanges();
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
}