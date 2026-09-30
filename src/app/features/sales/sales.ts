import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  DecimalPipe,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  ProductsService,
  Product,
} from '../../core/services/products.service';

import {
  SalesService,
  PaymentMethod,
  Sale,
} from '../../core/services/sales.service';

interface SaleItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

interface SaleDetailItem {
  _id: string;
  productId: {
    _id: string;
    name: string;
    barcode?: string;
    sku?: string;
    brand?: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

@Component({
  imports: [
    DecimalPipe,
    FormsModule,
  ],
  selector: 'app-sales',
  styleUrl: './sales.scss',
  templateUrl: './sales.html',
})
export class Sales implements OnInit {
  products = signal<Product[]>([]);

  saleItems = signal<SaleItem[]>([]);

  sales = signal<Sale[]>([]);

  selectedSale = signal<Sale | null>(null);

  selectedSaleItems =
    signal<SaleDetailItem[]>([]);

  loading = signal(true);

  error = signal('');

  salesLoading = signal(true);

  salesError = signal('');

  saleDetailLoading = signal(false);

  saleDetailError = signal('');

  searchTerm = signal('');

  searchLoading = signal(false);

  searchError = signal('');

  paymentMethod =
    signal<PaymentMethod | null>(null);

  registeringSale = signal(false);

  saleError = signal('');

  cancellingSale = signal(false);

  cancelSaleError = signal('');

  saleToCancel = signal<Sale | null>(null);

  cancellationReason = signal('');

  ngOnInit(): void {
    this.loadProducts();

    this.loadSales();
  }

  constructor(
    private readonly productsService: ProductsService,

    private readonly salesService: SalesService,
  ) {}

  loadProducts(): void {
    this.loading.set(true);

    this.error.set('');

    this.productsService.findAll().subscribe({
      next: (products) => {
        this.products.set(products);

        this.loading.set(false);
      },

      error: () => {
        this.error.set(
          'No fue posible cargar los productos.',
        );

        this.loading.set(false);
      },
    });
  }

  loadSales(): void {
    this.salesLoading.set(true);

    this.salesError.set('');

    this.salesService.findAll().subscribe({
      next: (sales) => {
        this.sales.set(sales);

        this.salesLoading.set(false);
      },

      error: () => {
        this.salesError.set(
          'No fue posible cargar el historial de ventas.',
        );

        this.salesLoading.set(false);
      },
    });
  }

  viewSaleDetail(
    saleId: string,
  ): void {
    if (this.saleDetailLoading()) {
      return;
    }

    this.selectedSale.set(null);

    this.selectedSaleItems.set([]);

    this.saleDetailLoading.set(true);

    this.saleDetailError.set('');

    this.salesService
      .findOne(saleId)
      .subscribe({
        next: (response) => {
          this.selectedSale.set(
            response.sale,
          );

          this.selectedSaleItems.set(
            response.items as SaleDetailItem[],
          );

          this.saleDetailLoading.set(false);
        },

        error: (error) => {
          this.saleDetailLoading.set(false);

          if (error?.status === 401) {
            this.saleDetailError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 404) {
            this.saleDetailError.set(
              'La venta no fue encontrada.',
            );

            return;
          }

          this.saleDetailError.set(
            'No fue posible cargar el detalle de la venta.',
          );
        },
      });
  }

  closeSaleDetail(): void {
    this.selectedSale.set(null);

    this.selectedSaleItems.set([]);

    this.saleDetailError.set('');
  }

  openCancelSale(
    sale: Sale,
  ): void {
    if (sale.status !== 'COMPLETED') {
      return;
    }

    if (this.cancellingSale()) {
      return;
    }

    this.saleToCancel.set(sale);

    this.cancellationReason.set('');

    this.cancelSaleError.set('');
  }

  closeCancelSale(): void {
    if (this.cancellingSale()) {
      return;
    }

    this.saleToCancel.set(null);

    this.cancellationReason.set('');

    this.cancelSaleError.set('');
  }

  updateCancellationReason(
    value: string,
  ): void {
    this.cancellationReason.set(value);
  }

  confirmCancelSale(): void {
    const sale =
      this.saleToCancel();

    if (!sale) {
      return;
    }

    if (sale.status !== 'COMPLETED') {
      this.cancelSaleError.set(
        'La venta ya no puede cancelarse porque no está en estado COMPLETED.',
      );

      return;
    }

    if (this.cancellingSale()) {
      return;
    }

    this.cancellingSale.set(true);

    this.cancelSaleError.set('');

    this.salesService
      .cancel(
        sale._id,
        this.cancellationReason()
          .trim() || undefined,
      )
      .subscribe({
        next: (cancelledSale) => {
          this.cancellingSale.set(false);

          this.saleToCancel.set(null);

          this.cancellationReason.set('');

          this.cancelSaleError.set('');

          this.sales.update(
            (currentSales) =>
              currentSales.map(
                (currentSale) =>
                  currentSale._id ===
                  cancelledSale._id
                    ? cancelledSale
                    : currentSale,
              ),
          );

          if (
            this.selectedSale()?._id ===
            cancelledSale._id
          ) {
            this.selectedSale.set(
              cancelledSale,
            );
          }

          this.loadProducts();

          this.loadSales();
        },

        error: (error) => {
          this.cancellingSale.set(false);

          if (error?.status === 400) {
            this.cancelSaleError.set(
              error?.error?.message ??
                'La venta no puede cancelarse.',
            );

            return;
          }

          if (error?.status === 401) {
            this.cancelSaleError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 403) {
            this.cancelSaleError.set(
              'No tienes permisos para cancelar ventas.',
            );

            return;
          }

          if (error?.status === 404) {
            this.cancelSaleError.set(
              'La venta no fue encontrada.',
            );

            return;
          }

          this.cancelSaleError.set(
            'No fue posible cancelar la venta. Intenta nuevamente.',
          );
        },
      });
  }

  updateSearchTerm(
    value: string,
  ): void {
    this.searchTerm.set(value);

    this.searchError.set('');

    const term =
      value.trim();

    if (!term) {
      this.products.set([]);

      return;
    }

    this.searchProducts(term);
  }

  searchProducts(
    term: string,
  ): void {
    const searchValue =
      term.trim();

    if (!searchValue) {
      this.products.set([]);

      return;
    }

    if (this.searchLoading()) {
      return;
    }

    this.searchLoading.set(true);

    this.searchError.set('');

    this.productsService
      .search(searchValue)
      .subscribe({
        next: (products) => {
          const activeProducts =
            products.filter(
              (product) =>
                product.status ===
                'ACTIVE',
            );

          this.products.set(
            activeProducts,
          );

          this.searchLoading.set(false);

          const exactProduct =
            activeProducts.find(
              (product) =>
                product.barcode ===
                  searchValue ||
                product.sku ===
                  searchValue,
            );

          if (exactProduct) {
            this.addProduct(
              exactProduct,
            );

            this.searchTerm.set('');

            this.products.set([]);

            return;
          }

          if (
            activeProducts.length === 0
          ) {
            this.searchError.set(
              'No encontramos un producto con ese código, SKU o nombre.',
            );
          }
        },

        error: (error) => {
          this.searchLoading.set(false);

          if (error?.status === 401) {
            this.searchError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.searchError.set(
            'No fue posible buscar el producto.',
          );
        },
      });
  }

  filteredProducts(): Product[] {
    return this.products()
      .filter(
        (product) =>
          product.status ===
          'ACTIVE',
      );
  }

  addProduct(
    product: Product,
  ): void {
    const currentItems =
      this.saleItems();

    const existingItem =
      currentItems.find(
        (item) =>
          item.product._id ===
          product._id,
      );

    if (existingItem) {
      if (
        existingItem.quantity >=
        product.stock
      ) {
        this.saleError.set(
          `No hay más unidades disponibles de ${product.name}.`,
        );

        return;
      }

      const updatedItems =
        currentItems.map((item) => {
          if (
            item.product._id !==
            product._id
          ) {
            return item;
          }

          const quantity =
            item.quantity + 1;

          return {
            ...item,
            quantity,
            subtotal:
              product.salePrice *
              quantity,
          };
        });

      this.saleItems.set(
        updatedItems,
      );

      this.saleError.set('');

      return;
    }

    if (product.stock <= 0) {
      this.saleError.set(
        `El producto ${product.name} no tiene stock disponible.`,
      );

      return;
    }

    this.saleItems.set([
      ...currentItems,
      {
        product,
        quantity: 1,
        subtotal: product.salePrice,
      },
    ]);

    this.saleError.set('');
  }

  increaseQuantity(
    productId: string,
  ): void {
    const updatedItems =
      this.saleItems().map(
        (item) => {
          if (
            item.product._id !==
            productId
          ) {
            return item;
          }

          if (
            item.quantity >=
            item.product.stock
          ) {
            return item;
          }

          const quantity =
            item.quantity + 1;

          return {
            ...item,
            quantity,
            subtotal:
              item.product.salePrice *
              quantity,
          };
        },
      );

    this.saleItems.set(
      updatedItems,
    );
  }

  decreaseQuantity(
    productId: string,
  ): void {
    const updatedItems =
      this.saleItems()
        .map((item) => {
          if (
            item.product._id !==
            productId
          ) {
            return item;
          }

          const quantity =
            item.quantity - 1;

          return {
            ...item,
            quantity,
            subtotal:
              item.product.salePrice *
              quantity,
          };
        })
        .filter(
          (item) =>
            item.quantity > 0,
        );

    this.saleItems.set(
      updatedItems,
    );
  }

  removeProduct(
    productId: string,
  ): void {
    const updatedItems =
      this.saleItems().filter(
        (item) =>
          item.product._id !==
          productId,
      );

    this.saleItems.set(
      updatedItems,
    );
  }

  totalSale(): number {
    return this.saleItems().reduce(
      (total, item) =>
        total + item.subtotal,
      0,
    );
  }

  selectPaymentMethod(
    paymentMethod: PaymentMethod,
  ): void {
    this.paymentMethod.set(
      paymentMethod,
    );

    this.saleError.set('');
  }

  registerSale(): void {
    this.saleError.set('');

    if (this.saleItems().length === 0) {
      this.saleError.set(
        'Agrega al menos un producto a la venta.',
      );

      return;
    }

    const selectedPaymentMethod =
      this.paymentMethod();

    if (!selectedPaymentMethod) {
      this.saleError.set(
        'Selecciona un método de pago.',
      );

      return;
    }

    if (this.registeringSale()) {
      return;
    }

    this.registeringSale.set(true);

    const saleData = {
      items: this.saleItems().map(
        (item) => ({
          productId:
            item.product._id,

          quantity:
            item.quantity,
        }),
      ),

      discount: 0,

      paymentMethod:
        selectedPaymentMethod,
    };

    this.salesService
      .create(saleData)
      .subscribe({
        next: () => {
          this.saleItems.set([]);

          this.paymentMethod.set(null);

          this.searchTerm.set('');

          this.products.set([]);

          this.saleError.set('');

          this.registeringSale.set(false);

          this.loadProducts();

          this.loadSales();
        },

        error: (error) => {
          this.registeringSale.set(false);

          if (error?.status === 400) {
            this.saleError.set(
              error?.error?.message ??
                'No fue posible registrar la venta. Verifica los productos, cantidades y método de pago.',
            );

            return;
          }

          if (error?.status === 401) {
            this.saleError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 404) {
            this.saleError.set(
              error?.error?.message ??
                'Uno de los productos de la venta no existe.',
            );

            return;
          }

          this.saleError.set(
            'No fue posible registrar la venta. Intenta nuevamente.',
          );
        },
      });
  }
}