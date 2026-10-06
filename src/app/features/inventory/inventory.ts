import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  DatePipe,
} from '@angular/common';

import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';

import {
  ProductsService,
  Product,
} from '../../core/services/products.service';

import {
  InventoryService,
  InventoryMovement,
  InventoryMovementType,
} from '../../core/services/inventory.service';

interface InventoryMovementView
  extends InventoryMovement {
  productName: string;
  productSku?: string;
}

@Component({
  selector: 'app-inventory',
  imports: [
    DatePipe,
    ReactiveFormsModule,
  ],
  templateUrl: './inventory.html',
  styleUrl: './inventory.scss',
})
export class Inventory implements OnInit {
  products = signal<Product[]>([]);
  movements = signal<InventoryMovementView[]>([]);
  loading = signal(true);
  loadingMovements = signal(true);
  error = signal('');
  movementsError = signal('');
  showForm = signal(false);
  formError = signal('');
  saving = signal(false);
  selectedProduct = signal<Product | null>(null);

  inventoryForm;

  constructor(
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.inventoryForm =
      this.formBuilder.group({
        productId: [
          '',
          [Validators.required],
        ],
        type: [
          'IN' as InventoryMovementType,
          [Validators.required],
        ],
        quantity: [
          1,
          [
            Validators.required,
            Validators.min(0.01),
          ],
        ],
        reason: [
          '',
        ],
      });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadMovements();

    this.inventoryForm
      .get('productId')
      ?.valueChanges
      .subscribe((productId) => {
        this.updateSelectedProduct(
          productId ?? '',
        );
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
            products.filter(
              (product) =>
                product.status === 'ACTIVE',
            ),
          );

          this.loading.set(false);

          const selectedProductId =
            this.inventoryForm.get(
              'productId',
            )?.value ?? '';

          if (selectedProductId) {
            this.updateSelectedProduct(
              selectedProductId,
            );
          }
        },

        error: () => {
          this.error.set(
            'No fue posible cargar los productos.',
          );
          this.loading.set(false);
        },
      });
  }

  loadMovements(): void {
    this.loadingMovements.set(true);
    this.movementsError.set('');

    this.inventoryService
      .findAll()
      .subscribe({
        next: (movements) => {
          this.movements.set(
            movements.map(
              (movement) =>
                this.mapMovement(
                  movement,
                ),
            ),
          );

          this.loadingMovements.set(
            false,
          );
        },

        error: () => {
          this.movementsError.set(
            'No fue posible cargar el historial de movimientos.',
          );

          this.loadingMovements.set(
            false,
          );
        },
      });
  }

  private mapMovement(
    movement: InventoryMovement,
  ): InventoryMovementView {
    const product =
      this.products().find(
        (item) =>
          item._id ===
          movement.productId,
      );

    return {
      ...movement,
      productName:
        product?.name ??
        'Producto no encontrado',
      productSku:
        product?.sku,
    };
  }

  updateSelectedProduct(
    productId: string,
  ): void {
    const product =
      this.products().find(
        (item) =>
          item._id === productId,
      ) ?? null;

    this.selectedProduct.set(
      product,
    );
  }

  openForm(): void {
    this.formError.set('');
    this.saving.set(false);

    this.inventoryForm.reset({
      productId: '',
      type: 'IN',
      quantity: 1,
      reason: '',
    });

    this.selectedProduct.set(null);

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
    this.saving.set(false);

    this.inventoryForm.reset({
      productId: '',
      type: 'IN',
      quantity: 1,
      reason: '',
    });

    this.selectedProduct.set(null);
  }

  onTypeChange(): void {
    this.formError.set('');

    this.inventoryForm
      .get('quantity')
      ?.setValue(1);
  }

  get movementType():
    InventoryMovementType {
    return (
      this.inventoryForm.get(
        'type',
      )?.value ??
      'IN'
    ) as InventoryMovementType;
  }

  get quantityLabel(): string {
    if (
      this.movementType ===
      'ADJUSTMENT'
    ) {
      return 'Nuevo stock';
    }

    return 'Cantidad';
  }

  get movementTitle(): string {
    if (
      this.movementType ===
      'IN'
    ) {
      return 'Entrada de inventario';
    }

    if (
      this.movementType ===
      'OUT'
    ) {
      return 'Salida de inventario';
    }

    return 'Ajuste de inventario';
  }

  get movementDescription(): string {
    if (
      this.movementType ===
      'IN'
    ) {
      return 'Agrega unidades al stock actual del producto.';
    }

    if (
      this.movementType ===
      'OUT'
    ) {
      return 'Retira unidades del stock actual del producto.';
    }

    return 'Establece el stock real del producto.';
  }

  validateForm(): boolean {
    this.formError.set('');

    if (
      this.inventoryForm.invalid
    ) {
      this.inventoryForm.markAllAsTouched();

      this.formError.set(
        'Completa correctamente los campos obligatorios.',
      );

      return false;
    }

    const formValue =
      this.inventoryForm.getRawValue();

    const product =
      this.selectedProduct();

    if (!product) {
      this.formError.set(
        'Selecciona un producto válido.',
      );

      return false;
    }

    const quantity =
      Number(
        formValue.quantity,
      );

    if (
      !Number.isFinite(
        quantity,
      ) ||
      quantity <= 0
    ) {
      this.formError.set(
        'La cantidad debe ser mayor que cero.',
      );

      return false;
    }

    if (
      this.movementType ===
        'OUT' &&
      quantity > product.stock
    ) {
      this.formError.set(
        `No puedes retirar ${quantity} unidades. El producto solo tiene ${product.stock} unidades disponibles.`,
      );

      return false;
    }

    return true;
  }

  saveMovement(): void {
    if (!this.validateForm()) {
      return;
    }

    const formValue =
      this.inventoryForm.getRawValue();

    const quantity =
      Number(
        formValue.quantity,
      );

    this.saving.set(true);
    this.formError.set('');

    this.inventoryService
      .createMovement({
        productId:
          formValue.productId ?? '',
        type:
          formValue.type as InventoryMovementType,
        quantity,
        reason:
          formValue.reason?.trim() ||
          undefined,
      })
      .subscribe({
        next: () => {
          this.closeForm();

          this.loadProducts();

          this.loadMovements();
        },

        error: (error) => {
          this.saving.set(false);

          if (
            error?.status ===
            400
          ) {
            this.formError.set(
              error?.error?.message ??
                'El movimiento no es válido. Verifica el stock y la cantidad.',
            );

            return;
          }

          if (
            error?.status ===
            404
          ) {
            this.formError.set(
              'El producto seleccionado no existe.',
            );

            return;
          }

          if (
            error?.status ===
            401
          ) {
            this.formError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.formError.set(
            'No fue posible registrar el movimiento.',
          );
        },
      });
  }

  getMovementLabel(
    type: InventoryMovementType,
  ): string {
    if (type === 'IN') {
      return 'Entrada';
    }

    if (type === 'OUT') {
      return 'Salida';
    }

    return 'Ajuste';
  }

  getMovementClass(
    type: InventoryMovementType,
  ): string {
    if (type === 'IN') {
      return 'in';
    }

    if (type === 'OUT') {
      return 'out';
    }

    return 'adjustment';
  }
}