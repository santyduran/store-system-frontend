import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  DatePipe,
  DecimalPipe,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
} from '@angular/router';

import {
  ProductsService,
  Product,
} from '../../core/services/products.service';

import {
  SalesService,
  PaymentMethod,
  Sale,
  PendingSale,
  CreatePendingSale,
  UpdatePendingSale,
} from '../../core/services/sales.service';

import {
  CustomersService,
  Customer,
} from '../../core/services/customers.service';

import {
  InvoicesService,
  InvoiceDetail,
} from '../../core/services/invoices.service';

interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
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
  selector: 'app-sales',
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
  ],
})
export class Sales implements OnInit {
  menuOpen = signal(false);

  products = signal<Product[]>([]);
  saleItems = signal<SaleItem[]>([]);
  sales = signal<Sale[]>([]);

  pendingSales =
    signal<PendingSale[]>([]);
  pendingSalesLoading =
    signal(false);
  pendingSalesError =
    signal('');
  activePendingSaleId =
    signal<string | null>(null);
  pendingSaving =
    signal(false);
  pendingError =
    signal('');

  selectedSale =
    signal<Sale | null>(null);
  selectedSaleItems =
    signal<SaleDetailItem[]>([]);

  customers =
    signal<Customer[]>([]);
  selectedCustomer =
    signal<Customer | null>(null);

  customersLoading =
    signal(false);
  customersError =
    signal('');

  loading =
    signal(true);
  error =
    signal('');

  salesLoading =
    signal(true);
  salesError =
    signal('');

  saleDetailLoading =
    signal(false);
  saleDetailError =
    signal('');

  searchTerm =
    signal('');
  searchLoading =
    signal(false);
  searchError =
    signal('');

  paymentMethod =
    signal<PaymentMethod | null>(null);

  registeringSale =
    signal(false);
  saleError =
    signal('');

  cancellingSale =
    signal(false);
  cancelSaleError =
    signal('');
  saleToCancel =
    signal<Sale | null>(null);
  cancellationReason =
    signal('');

  invoiceLoading =
    signal(false);
  invoiceError =
    signal('');
  generatedInvoice =
    signal<InvoiceDetail | null>(null);

  private printWindow:
    Window | null = null;

  showElectronicInvoicePrompt =
    signal(false);

  showDeliveryChannelPrompt =
    signal(false);

  invoiceDeliveryChannel =
    signal<
      'EMAIL' | 'WHATSAPP' | null
    >(null);

  pendingInvoiceSaleId =
    signal<string | null>(null);

  pendingInvoiceCustomer =
    signal<Customer | null>(null);

  showInvoiceCustomerForm =
    signal(false);

  invoiceCustomerDocumentType =
    signal<
      'CC' |
      'CE' |
      'NIT' |
      'PASSPORT' |
      'OTHER'
    >('CC');

  invoiceCustomerDocumentNumber =
    signal('');

  invoiceCustomerFirstName =
    signal('');

  invoiceCustomerLastName =
    signal('');

  invoiceCustomerEmail =
    signal('');

  private pendingSaveTimer:
    ReturnType<typeof setTimeout> |
    null = null;

  private pendingSaveQueued =
    false;

  constructor(
    private readonly productsService:
      ProductsService,
    private readonly salesService:
      SalesService,
    private readonly customersService:
      CustomersService,
    private readonly invoicesService:
      InvoicesService,
    private readonly router: Router,
  ) {}

  toggleMenu(): void {
    this.menuOpen.update(
      (isOpen) => !isOpen,
    );
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  navigateToCashRegister(): void {
    this.closeMenu();

    void this.router.navigate([
      '/cash-register',
    ]);
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadSales();
    this.loadCustomers();
    this.loadPendingSales();
  }

  loadCustomers(): void {
    this.customersLoading.set(true);
    this.customersError.set('');

    this.customersService
      .findActive()
      .subscribe({
        next: (customers) => {
          this.customers.set(
            customers,
          );

          this.customersLoading.set(
            false,
          );
        },

        error: (error) => {
          this.customersLoading.set(
            false,
          );

          if (error?.status === 401) {
            this.customersError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.customersError.set(
            'No fue posible cargar los clientes.',
          );
        },
      });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.productsService
      .findAll()
      .subscribe({
        next: (products) => {
          this.products.set(
            products,
          );

          this.loading.set(
            false,
          );
        },

        error: (error) => {
          this.loading.set(
            false,
          );

          if (error?.status === 401) {
            this.error.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.error.set(
            'No fue posible cargar los productos.',
          );
        },
      });
  }

  loadSales(): void {
    this.salesLoading.set(true);
    this.salesError.set('');

    this.salesService
      .findAll()
      .subscribe({
        next: (sales) => {
          this.sales.set(
            sales,
          );

          this.salesLoading.set(
            false,
          );
        },

        error: () => {
          this.salesError.set(
            'No fue posible cargar el historial de ventas.',
          );

          this.salesLoading.set(
            false,
          );
        },
      });
  }

  loadPendingSales(): void {
    this.pendingSalesLoading.set(
      true,
    );

    this.pendingSalesError.set('');

    this.salesService
      .findPending()
      .subscribe({
        next: (pendingSales) => {
          this.pendingSales.set(
            pendingSales,
          );

          this.pendingSalesLoading.set(
            false,
          );
        },

        error: (error) => {
          this.pendingSalesLoading.set(
            false,
          );

          if (error?.status === 401) {
            this.pendingSalesError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.pendingSalesError.set(
            'No fue posible cargar las ventas pendientes.',
          );
        },
      });
  }

  updateSearchTerm(
    value: string,
  ): void {
    this.searchTerm.set(value);
  }

  searchProducts(): void {
    const term =
      this.searchTerm().trim();

    if (!term) {
      this.loadProducts();
      return;
    }

    this.searchLoading.set(true);
    this.searchError.set('');

    this.productsService
      .search(term)
      .subscribe({
        next: (products) => {
          this.products.set(
            products,
          );

          this.searchLoading.set(
            false,
          );
        },

        error: (error) => {
          this.searchLoading.set(
            false,
          );

          if (error?.status === 401) {
            this.searchError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.searchError.set(
            'No fue posible buscar productos.',
          );
        },
      });
  }

  clearProductSearch(): void {
    this.searchTerm.set('');
    this.searchError.set('');
    this.loadProducts();
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

          this.saleDetailLoading.set(
            false,
          );
        },

        error: (error) => {
          this.saleDetailLoading.set(
            false,
          );

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
    this.cancellationReason.set(
      value,
    );
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
          .trim() ||
          undefined,
      )
      .subscribe({
        next: (cancelledSale) => {
          this.cancellingSale.set(
            false,
          );

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
          this.cancellingSale.set(
            false,
          );

          if (error?.status === 400) {
            this.cancelSaleError.set(
              error?.error?.message ||
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
              'No tienes permisos para cancelar esta venta.',
            );
            return;
          }

          this.cancelSaleError.set(
            'No fue posible cancelar la venta.',
          );
        },
      });
  }

  filteredProducts(): Product[] {
    return this.products().filter(
      (product) =>
        product.status ===
        'ACTIVE',
    );
  }

  private getProductTaxRate(
    product: Product,
  ): number {
    const productWithTax =
      product as Product & {
        taxRate?: number;
      };

    const taxRate =
      Number(
        productWithTax.taxRate ??
        0,
      );

    if (
      !Number.isFinite(taxRate) ||
      taxRate < 0
    ) {
      return 0;
    }

    return taxRate;
  }

  private calculateSaleItem(
    product: Product,
    quantity: number,
  ): {
    unitPrice: number;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  } {
    const salePrice =
      Number(
        product.salePrice,
      );

    const taxRate =
      this.getProductTaxRate(
        product,
      );

    const unitPrice =
      taxRate > 0
        ? salePrice /
          (1 + taxRate / 100)
        : salePrice;

    const roundedUnitPrice =
      Math.round(
        unitPrice * 100,
      ) / 100;

    const subtotal =
      Math.round(
        roundedUnitPrice *
        quantity *
        100,
      ) / 100;

    const total =
      Math.round(
        salePrice *
        quantity *
        100,
      ) / 100;

    const taxAmount =
      Math.round(
        (total - subtotal) *
        100,
      ) / 100;

    return {
      unitPrice:
        roundedUnitPrice,
      subtotal,
      taxRate,
      taxAmount,
      total,
    };
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
        currentItems.map(
          (item) => {
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
              ...this.calculateSaleItem(
                product,
                quantity,
              ),
            };
          },
        );

      this.saleItems.set(
        updatedItems,
      );

      this.saleError.set('');
      this.schedulePendingSave();

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
        ...this.calculateSaleItem(
          product,
          1,
        ),
      },
    ]);

    this.saleError.set('');
    this.schedulePendingSave();
  }

  addProductToSale(
    product: Product,
  ): void {
    this.addProduct(product);
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
            ...this.calculateSaleItem(
              item.product,
              quantity,
            ),
          };
        },
      );

    this.saleItems.set(
      updatedItems,
    );

    this.schedulePendingSave();
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
            ...this.calculateSaleItem(
              item.product,
              quantity,
            ),
          };
        })
        .filter(
          (item) =>
            item.quantity > 0,
        );

    this.saleItems.set(
      updatedItems,
    );

    this.schedulePendingSave();
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

    this.schedulePendingSave();
  }

  removeProductFromSale(
    productId: string,
  ): void {
    this.removeProduct(
      productId,
    );
  }

  totalSale(): number {
    return this.total();
  }

  clearCustomer(): void {
    this.selectedCustomer.set(
      null,
    );

    this.schedulePendingSave();
  }

  selectCustomer(
    customerId: string,
  ): void {
    if (!customerId) {
      this.selectedCustomer.set(
        null,
      );

      this.schedulePendingSave();
      return;
    }

    const customer =
      this.customers().find(
        (item) =>
          item._id ===
          customerId,
      );

    this.selectedCustomer.set(
      customer || null,
    );

    this.schedulePendingSave();
  }

  total(): number {
    return this.saleItems().reduce(
      (sum, item) =>
        sum + item.total,
      0,
    );
  }

  subtotal(): number {
    return this.saleItems().reduce(
      (sum, item) =>
        sum + item.subtotal,
      0,
    );
  }

  tax(): number {
    return this.saleItems().reduce(
      (sum, item) =>
        sum + item.taxAmount,
      0,
    );
  }

  setPaymentMethod(
    paymentMethod: PaymentMethod,
  ): void {
    this.paymentMethod.set(
      paymentMethod,
    );
  }

  selectPaymentMethod(
    paymentMethod: PaymentMethod,
  ): void {
    this.setPaymentMethod(
      paymentMethod,
    );
  }

  registerSale(): void {
    if (this.registeringSale()) {
      return;
    }

    const items =
      this.saleItems();

    if (items.length === 0) {
      this.saleError.set(
        'Agrega al menos un producto a la venta.',
      );
      return;
    }

    const paymentMethod =
      this.paymentMethod();

    if (!paymentMethod) {
      this.saleError.set(
        'Selecciona un método de pago.',
      );
      return;
    }

    const customerId =
      this.selectedCustomer()?._id;

    const payload = {
      items: items.map(
        (item) => ({
          productId:
            item.product._id,
          quantity:
            item.quantity,
        }),
      ),
      customerId,
      paymentMethod,
    };

    this.registeringSale.set(
      true,
    );

    this.saleError.set('');

    this.salesService
      .create(payload)
      .subscribe({
        next: (sale) => {
          this.registeringSale.set(
            false,
          );

          this.sales.update(
            (currentSales) => [
              sale,
              ...currentSales,
            ],
          );

          this.loadProducts();
          this.loadSales();

          this.printReceipt(
            sale,
          );
        },

        error: (error) => {
          this.registeringSale.set(
            false,
          );

          if (error?.status === 400) {
            this.saleError.set(
              error?.error?.message ||
              'No fue posible registrar la venta.',
            );
            return;
          }

          if (error?.status === 401) {
            this.saleError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.saleError.set(
            'No fue posible registrar la venta.',
          );
        },
      });
  }

  clearSale(): void {
    this.saleItems.set([]);
    this.paymentMethod.set(null);
    this.selectedCustomer.set(null);
    this.saleError.set('');
    this.activePendingSaleId.set(
      null,
    );
  }

  private schedulePendingSave(): void {
    if (this.pendingSaveTimer) {
      clearTimeout(
        this.pendingSaveTimer,
      );
    }

    this.pendingSaveTimer =
      setTimeout(() => {
        this.pendingSaveTimer = null;
        this.saveCurrentSaleAsPending();
      }, 500);
  }

  private saveCurrentSaleAsPending(
    onSaved?: () => void,
  ): void {
    const items =
      this.saleItems();

    if (items.length === 0) {
      return;
    }

    if (this.pendingSaving()) {
      this.pendingSaveQueued = true;
      return;
    }

    const payload:
      CreatePendingSale = {
      items: items.map(
        (item) => ({
          productId:
            item.product._id,
          quantity:
            item.quantity,
        }),
      ),
      customerId:
        this.selectedCustomer()?._id,
      discount: 0,
    };

    const activeId =
      this.activePendingSaleId();

    this.pendingSaving.set(
      true,
    );

    this.pendingError.set('');

    const request$ =
      activeId
        ? this.salesService.updatePending(
            activeId,
            payload as UpdatePendingSale,
          )
        : this.salesService.createPending(
            payload,
          );

    request$.subscribe({
      next: (pendingSale) => {
        this.pendingSaving.set(
          false,
        );

        this.activePendingSaleId.set(
          pendingSale._id,
        );

        this.pendingSales.update(
          (current) => {
            const exists =
              current.some(
                (item) =>
                  item._id ===
                  pendingSale._id,
              );

            if (exists) {
              return current.map(
                (item) =>
                  item._id ===
                  pendingSale._id
                    ? pendingSale
                    : item,
              );
            }

            return [
              pendingSale,
              ...current,
            ];
          },
        );

        onSaved?.();

        if (
          this.pendingSaveQueued
        ) {
          this.pendingSaveQueued =
            false;

          this.schedulePendingSave();
        }
      },

      error: (error) => {
        this.pendingSaving.set(
          false,
        );

        if (error?.status === 401) {
          this.pendingError.set(
            'Tu sesión ha expirado. Inicia sesión nuevamente.',
          );
        } else {
          this.pendingError.set(
            error?.error?.message ||
            'No fue posible guardar la venta pendiente.',
          );
        }

        if (
          this.pendingSaveQueued
        ) {
          this.pendingSaveQueued =
            false;

          this.schedulePendingSave();
        }
      },
    });
  }

  openPendingSale(
    pendingSaleId: string,
  ): void {
    if (
      this.pendingSaving() ||
      this.registeringSale()
    ) {
      return;
    }

    this.pendingError.set('');

    this.salesService
      .findPendingOne(
        pendingSaleId,
      )
      .subscribe({
        next: (pendingSale) => {
          this.activePendingSaleId.set(
            pendingSale._id,
          );

          const mappedItems =
            pendingSale.items
              .map((item) => {
                const product =
                  typeof item.productId ===
                  'object'
                    ? item.productId
                    : this.products().find(
                        (productItem) =>
                          productItem._id ===
                          item.productId,
                      );

                if (!product) {
                  return null;
                }

                const unitPrice =
                  Number(
                    item.unitPrice,
                  );

                const taxRate =
                  Number(
                    item.taxRate ??
                    0,
                  );

                const quantity =
                  Number(
                    item.quantity,
                  );

                const subtotal =
                  Math.round(
                    unitPrice *
                    quantity *
                    100,
                  ) / 100;

                const total =
                  Math.round(
                    subtotal *
                    (1 +
                      taxRate /
                        100) *
                    100,
                  ) / 100;

                const taxAmount =
                  Math.round(
                    (total -
                      subtotal) *
                    100,
                  ) / 100;

                return {
                  product,
                  quantity,
                  unitPrice,
                  subtotal,
                  taxRate,
                  taxAmount,
                  total,
                };
              })
              .filter(
                (
                  item,
                ): item is SaleItem =>
                  item !== null,
              );

          this.saleItems.set(
            mappedItems,
          );

          const customerId =
            typeof pendingSale.customerId ===
            'string'
              ? pendingSale.customerId
              : pendingSale.customerId?._id;

          const customer =
            this.customers().find(
              (item) =>
                item._id ===
                customerId,
            );

          this.selectedCustomer.set(
            customer || null,
          );

          this.paymentMethod.set(
            null,
          );

          this.saleError.set('');
        },

        error: (error) => {
          if (error?.status === 401) {
            this.pendingError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.pendingError.set(
            error?.error?.message ||
            'No fue posible abrir la venta pendiente.',
          );
        },
      });
  }

  startNewSale(): void {
    if (
      this.saleItems().length >
        0 &&
      !this.pendingSaving()
    ) {
      this.saveCurrentSaleAsPending(
        () => {
          this.activePendingSaleId.set(
            null,
          );

          this.saleItems.set([]);
          this.selectedCustomer.set(
            null,
          );
          this.paymentMethod.set(
            null,
          );
          this.saleError.set('');
        },
      );

      return;
    }

    this.activePendingSaleId.set(
      null,
    );

    this.saleItems.set([]);
    this.selectedCustomer.set(
      null,
    );
    this.paymentMethod.set(
      null,
    );
    this.saleError.set('');
  }

  completePendingSale(): void {
    const pendingId =
      this.activePendingSaleId();

    if (!pendingId) {
      this.registerSale();
      return;
    }

    if (
      this.saleItems().length === 0
    ) {
      this.saleError.set(
        'La venta no tiene productos.',
      );
      return;
    }

    const paymentMethod =
      this.paymentMethod();

    if (!paymentMethod) {
      this.saleError.set(
        'Selecciona un método de pago.',
      );
      return;
    }

    if (this.registeringSale()) {
      return;
    }

    this.registeringSale.set(
      true,
    );

    this.saleError.set('');

    this.salesService
      .completePending(
        pendingId,
        {
          paymentMethod,
        },
      )
      .subscribe({
        next: (sale) => {
          this.registeringSale.set(
            false,
          );

          this.sales.update(
            (currentSales) => [
              sale,
              ...currentSales,
            ],
          );

          this.pendingSales.update(
            (current) =>
              current.filter(
                (item) =>
                  item._id !==
                  pendingId,
              ),
          );

          this.activePendingSaleId.set(
            null,
          );

          this.saleItems.set([]);
          this.selectedCustomer.set(
            null,
          );
          this.paymentMethod.set(
            null,
          );

          this.loadProducts();
          this.loadSales();

          this.printReceipt(
            sale,
          );
        },

        error: (error) => {
          this.registeringSale.set(
            false,
          );

          if (error?.status === 400) {
            this.saleError.set(
              error?.error?.message ||
              'No fue posible finalizar la venta.',
            );
            return;
          }

          if (error?.status === 401) {
            this.saleError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.saleError.set(
            'No fue posible finalizar la venta pendiente.',
          );
        },
      });
  }

  cancelPendingSale(
    pendingSaleId: string,
  ): void {
    if (
      !window.confirm(
        '¿Deseas cancelar esta venta pendiente?',
      )
    ) {
      return;
    }

    this.pendingError.set('');

    this.salesService
      .cancelPending(
        pendingSaleId,
      )
      .subscribe({
        next: () => {
          this.pendingSales.update(
            (current) =>
              current.filter(
                (item) =>
                  item._id !==
                  pendingSaleId,
              ),
          );

          if (
            this.activePendingSaleId() ===
            pendingSaleId
          ) {
            this.activePendingSaleId.set(
              null,
            );

            this.saleItems.set([]);
            this.selectedCustomer.set(
              null,
            );
            this.paymentMethod.set(
              null,
            );
            this.saleError.set('');
          }
        },

        error: (error) => {
          if (error?.status === 401) {
            this.pendingError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          this.pendingError.set(
            error?.error?.message ||
            'No fue posible cancelar la venta pendiente.',
          );
        },
      });
  }

  printReceipt(
    sale: Sale,
  ): void {
    this.printWindow =
      window.open(
        '',
        '_blank',
        'width=420,height=700',
      );

    if (!this.printWindow) {
      this.saleError.set(
        'El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.',
      );
      return;
    }

    const customer =
      this.selectedCustomer();

    const receiptItems =
      this.saleItems();

    const itemsHtml =
      receiptItems
        .map(
          (item) => `
            <tr>
              <td>${item.product.name}</td>
              <td>${item.quantity}</td>
              <td>${this.formatCurrency(item.total)}</td>
            </tr>
          `,
        )
        .join('');

    this.printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Comprobante ${sale.saleNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            width: 80mm;
            margin: 0 auto;
            padding: 12px;
            color: #111;
            font-size: 12px;
          }

          h1,
          h2,
          p {
            margin: 4px 0;
          }

          h1 {
            text-align: center;
            font-size: 18px;
          }

          .center {
            text-align: center;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            padding: 4px 0;
            text-align: left;
          }

          .total {
            font-size: 15px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <h1>STORE SYSTEM</h1>
        <p class="center">Comprobante de venta</p>
        <div class="line"></div>

        <p>
          <strong>Venta:</strong>
          ${sale.saleNumber}
        </p>

        <p>
          <strong>Fecha:</strong>
          ${new Date().toLocaleString('es-CO')}
        </p>

        <p>
          <strong>Pago:</strong>
          ${sale.paymentMethod}
        </p>

        ${
          customer
            ? `
              <p>
                <strong>Cliente:</strong>
                ${customer.firstName}
                ${customer.lastName}
              </p>

              <p>
                <strong>Documento:</strong>
                ${customer.documentNumber}
              </p>
            `
            : ''
        }

        <div class="line"></div>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="line"></div>

        <p>
          <strong>Subtotal:</strong>
          ${this.formatCurrency(
            sale.subtotal,
          )}
        </p>

        <p>
          <strong>IVA:</strong>
          ${this.formatCurrency(
            sale.tax ?? 0,
          )}
        </p>

        <p class="total">
          Total:
          ${this.formatCurrency(
            sale.total,
          )}
        </p>

        <div class="line"></div>

        <p class="center">
          Gracias por su compra.
        </p>
      </body>
      </html>
    `);

    this.printWindow.document.close();
    this.printWindow.focus();

    setTimeout(() => {
      this.printWindow?.print();

      this.showElectronicInvoicePrompt.set(
        true,
      );

      this.pendingInvoiceSaleId.set(
        sale._id,
      );

      this.pendingInvoiceCustomer.set(
        customer,
      );
    }, 300);
  }

  formatCurrency(
    value: number,
  ): string {
    return new Intl.NumberFormat(
      'es-CO',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(value);
  }

  skipElectronicInvoice(): void {
    this.showElectronicInvoicePrompt.set(
      false,
    );

    this.pendingInvoiceSaleId.set(
      null,
    );

    this.pendingInvoiceCustomer.set(
      null,
    );

    this.closePrintWindow();
  }

  requestElectronicInvoice(): void {
    const saleId =
      this.pendingInvoiceSaleId();

    if (!saleId) {
      return;
    }

    this.showElectronicInvoicePrompt.set(
      false,
    );

    const customer =
      this.pendingInvoiceCustomer();

    if (!customer) {
      this.clearInvoiceCustomerForm();

      this.showInvoiceCustomerForm.set(
        true,
      );

      return;
    }

    this.showDeliveryChannelPrompt.set(
      true,
    );
  }

  cancelElectronicInvoice(): void {
    this.skipElectronicInvoice();
  }

  updateInvoiceCustomerDocumentType(
    value:
      | 'CC'
      | 'CE'
      | 'NIT'
      | 'PASSPORT'
      | 'OTHER',
  ): void {
    this.invoiceCustomerDocumentType.set(
      value,
    );
  }

  updateInvoiceCustomerDocumentNumber(
    value: string,
  ): void {
    this.invoiceCustomerDocumentNumber.set(
      value,
    );
  }

  updateInvoiceCustomerFirstName(
    value: string,
  ): void {
    this.invoiceCustomerFirstName.set(
      value,
    );
  }

  updateInvoiceCustomerLastName(
    value: string,
  ): void {
    this.invoiceCustomerLastName.set(
      value,
    );
  }

  updateInvoiceCustomerEmail(
    value: string,
  ): void {
    this.invoiceCustomerEmail.set(
      value,
    );
  }

  clearInvoiceCustomerForm(): void {
    this.invoiceCustomerDocumentType.set(
      'CC',
    );

    this.invoiceCustomerDocumentNumber.set(
      '',
    );

    this.invoiceCustomerFirstName.set(
      '',
    );

    this.invoiceCustomerLastName.set(
      '',
    );

    this.invoiceCustomerEmail.set(
      '',
    );

    this.invoiceError.set('');
  }

  cancelInvoiceCustomerForm(): void {
    if (this.invoiceLoading()) {
      return;
    }

    this.showInvoiceCustomerForm.set(
      false,
    );

    this.clearInvoiceCustomerForm();
    this.pendingInvoiceSaleId.set(
      null,
    );

    this.pendingInvoiceCustomer.set(
      null,
    );

    this.closePrintWindow();
  }

  confirmInvoiceCustomerData(): void {
    if (this.invoiceLoading()) {
      return;
    }

    const documentNumber =
      this.invoiceCustomerDocumentNumber()
        .trim();

    const firstName =
      this.invoiceCustomerFirstName()
        .trim();

    const lastName =
      this.invoiceCustomerLastName()
        .trim();

    const email =
      this.invoiceCustomerEmail()
        .trim();

    if (!documentNumber) {
      this.invoiceError.set(
        'El número de documento es obligatorio.',
      );
      return;
    }

    if (!firstName) {
      this.invoiceError.set(
        'El nombre del cliente es obligatorio.',
      );
      return;
    }

    if (!lastName) {
      this.invoiceError.set(
        'El apellido del cliente es obligatorio.',
      );
      return;
    }

    if (!email) {
      this.invoiceError.set(
        'El correo electrónico es obligatorio.',
      );
      return;
    }

    const existingCustomer =
      this.customers().find(
        (customer) =>
          customer.documentNumber ===
          documentNumber,
      );

    // El cliente no tiene que estar registrado previamente.
    // La factura se genera con los datos capturados en este formulario.
    this.pendingInvoiceCustomer.set(
      existingCustomer ?? null,
    );

    this.showInvoiceCustomerForm.set(
      false,
    );

    this.invoiceError.set('');

    this.showDeliveryChannelPrompt.set(
      true,
    );
  }

  cancelInvoiceDeliveryChannel(): void {
    this.showDeliveryChannelPrompt.set(
      false,
    );

    this.invoiceDeliveryChannel.set(
      null,
    );

    this.pendingInvoiceSaleId.set(
      null,
    );

    this.pendingInvoiceCustomer.set(
      null,
    );

    this.clearInvoiceCustomerForm();
    this.closePrintWindow();
  }

  selectInvoiceDeliveryChannel(
    channel:
      | 'EMAIL'
      | 'WHATSAPP',
  ): void {
    this.invoiceDeliveryChannel.set(
      channel,
    );
  }

  confirmInvoiceDeliveryChannel(): void {
    const channel =
      this.invoiceDeliveryChannel();

    if (!channel) {
      this.invoiceError.set(
        'Selecciona un canal de entrega.',
      );
      return;
    }

    const saleId =
      this.pendingInvoiceSaleId();

    if (!saleId) {
      this.invoiceError.set(
        'No se encontró la venta para generar la factura.',
      );
      return;
    }

    // No se exige que exista un registro del cliente en el módulo Clientes.
    // generateElectronicInvoice utiliza los datos capturados en el formulario.
    this.generateElectronicInvoice(
      saleId,
    );
  }

  private generateElectronicInvoice(
    saleId: string,
  ): void {
    if (this.invoiceLoading()) {
      return;
    }

    this.invoiceLoading.set(true);
    this.invoiceError.set('');

    this.invoicesService
      .create({
        saleId,
        customer: {
          documentType:
            this.invoiceCustomerDocumentType(),

          documentNumber:
            this.invoiceCustomerDocumentNumber()
              .trim(),

          firstName:
            this.invoiceCustomerFirstName()
              .trim(),

          lastName:
            this.invoiceCustomerLastName()
              .trim() ||
            undefined,

          email:
            this.invoiceCustomerEmail()
              .trim() ||
            undefined,
        },
      })
      .subscribe({
        next: (invoice) => {
          this.invoiceLoading.set(
            false,
          );

          this.generatedInvoice.set(
            invoice as InvoiceDetail,
          );

          this.showDeliveryChannelPrompt.set(
            false,
          );

          this.showInvoiceCustomerForm.set(
            false,
          );

          this.pendingInvoiceSaleId.set(
            null,
          );

          this.pendingInvoiceCustomer.set(
            null,
          );

          this.clearInvoiceCustomerForm();

          this.invoiceDeliveryChannel.set(
            null,
          );

          this.invoiceError.set('');

          this.loadSales();
          this.closePrintWindow();
        },

        error: (error) => {
          this.invoiceLoading.set(
            false,
          );

          if (error?.status === 400) {
            this.invoiceError.set(
              error?.error?.message ??
              'No fue posible generar la factura electrónica.',
            );
            return;
          }

          if (error?.status === 401) {
            this.invoiceError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
            return;
          }

          if (error?.status === 404) {
            this.invoiceError.set(
              error?.error?.message ??
              'La venta no fue encontrada.',
            );
            return;
          }

          this.invoiceError.set(
            'No fue posible generar la factura electrónica.',
          );
        },
      });
  }

  closeGeneratedInvoice(): void {
    this.generatedInvoice.set(
      null,
    );

    this.invoiceError.set('');
  }

  closeInvoiceDetail(): void {
    this.generatedInvoice.set(
      null,
    );

    this.invoiceError.set('');
  }

  closePrintWindow(): void {
    if (
      this.printWindow &&
      !this.printWindow.closed
    ) {
      this.printWindow.close();
    }

    this.printWindow = null;
  }

  getPaymentMethodLabel(
    paymentMethod: PaymentMethod,
  ): string {
    switch (paymentMethod) {
      case 'CASH':
        return 'Efectivo';

      case 'CARD':
        return 'Tarjeta';

      case 'TRANSFER':
        return 'Transferencia';

      default:
        return paymentMethod;
    }
  }

  getSaleStatusLabel(
    status: string,
  ): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';

      case 'CANCELLED':
        return 'Cancelada';

      default:
        return status;
    }
  }

  getCustomerName(
    customerId:
      | string
      | Customer
      | undefined
      | null,
  ): string {
    if (!customerId) {
      return 'Consumidor final';
    }

    if (
      typeof customerId ===
      'string'
    ) {
      const customer =
        this.customers().find(
          (item) =>
            item._id ===
            customerId,
        );

      if (!customer) {
        return 'Consumidor final';
      }

      return `${customer.firstName} ${customer.lastName}`;
    }

    return `${customerId.firstName} ${customerId.lastName}`;
  }

  getPendingSaleCustomerName(
    pendingSale: PendingSale,
  ): string {
    if (!pendingSale.customerId) {
      return 'Consumidor final';
    }

    const customerId =
      typeof pendingSale.customerId ===
      'string'
        ? pendingSale.customerId
        : pendingSale.customerId?._id;

    const customer =
      this.customers().find(
        (item) =>
          item._id ===
          customerId,
      );

    if (customer) {
      return `${customer.firstName} ${customer.lastName}`;
    }

    if (
      typeof pendingSale.customerId !==
      'string'
    ) {
      return `${pendingSale.customerId.firstName} ${pendingSale.customerId.lastName}`;
    }

    return 'Consumidor final';
  }

  getPendingSaleSubtotal(
    pendingSale: PendingSale,
  ): number {
    return pendingSale.items.reduce(
      (total, item) =>
        total +
        Number(item.unitPrice) *
        Number(item.quantity),
      0,
    );
  }

  getPendingSaleTax(
    pendingSale: PendingSale,
  ): number {
    return pendingSale.items.reduce(
      (total, item) => {
        const subtotal =
          Number(item.unitPrice) *
          Number(item.quantity);

        const tax =
          subtotal *
          (
            Number(
              item.taxRate ?? 0,
            ) / 100
          );

        return total + tax;
      },
      0,
    );
  }

  getPendingSaleTotal(
    pendingSale: PendingSale,
  ): number {
    return (
      this.getPendingSaleSubtotal(
        pendingSale,
      ) +
      this.getPendingSaleTax(
        pendingSale,
      ) -
      Number(
        pendingSale.discount ||
        0,
      )
    );
  }
}