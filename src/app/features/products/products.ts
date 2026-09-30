import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  DecimalPipe,
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
  CategoriesService,
} from '../../core/services/categories.service';

interface Category {
  _id: string;
  name: string;
  description?: string;
  status: string;
}

@Component({
  selector: 'app-products',
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);

  loading = signal(true);
  error = signal('');

  showForm = signal(false);
  formError = signal('');
  saving = signal(false);

  editingProductId = signal<string | null>(null);

  deletingProductId = signal<string | null>(null);

  productForm;

  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.productForm = this.formBuilder.group({
      barcode: [
        '',
        [Validators.required],
      ],

      sku: [
        '',
        [Validators.required],
      ],

      name: [
        '',
        [Validators.required],
      ],

      brand: [
        '',
      ],

      categoryId: [
        '',
        [Validators.required],
      ],

      description: [
        '',
      ],

      purchasePrice: [
        0,
        [
          Validators.required,
          Validators.min(0),
        ],
      ],

      salePrice: [
        0,
        [
          Validators.required,
          Validators.min(0),
        ],
      ],

      stock: [
        0,
        [
          Validators.required,
          Validators.min(0),
        ],
      ],

      minStock: [
        0,
        [
          Validators.required,
          Validators.min(0),
        ],
      ],

      status: [
        'ACTIVE',
        [Validators.required],
      ],
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

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

  loadCategories(): void {
    this.categoriesService.findAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
    });
  }

  openForm(): void {
    this.editingProductId.set(null);
    this.formError.set('');

    this.productForm.reset({
      barcode: '',
      sku: '',
      name: '',
      brand: '',
      categoryId: '',
      description: '',
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 0,
      status: 'ACTIVE',
    });

    this.showForm.set(true);
  }

  editProduct(product: Product): void {
    this.editingProductId.set(product._id);
    this.formError.set('');

    this.productForm.reset({
      barcode: product.barcode,
      sku: product.sku,
      name: product.name,
      brand: product.brand ?? '',
      categoryId: product.category._id,
      description: product.description ?? '',
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      status: product.status,
    });

    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set('');
    this.saving.set(false);
    this.editingProductId.set(null);

    this.productForm.reset({
      barcode: '',
      sku: '',
      name: '',
      brand: '',
      categoryId: '',
      description: '',
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 0,
      status: 'ACTIVE',
    });
  }

  validateForm(): boolean {
    this.formError.set('');

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();

      this.formError.set(
        'Completa correctamente los campos obligatorios.',
      );

      return false;
    }

    return true;
  }

  saveProduct(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving.set(true);
    this.formError.set('');

    const formValue =
      this.productForm.getRawValue();

    const productData = {
      barcode: formValue.barcode ?? '',
      sku: formValue.sku ?? '',
      name: formValue.name ?? '',
      brand: formValue.brand || undefined,
      categoryId: formValue.categoryId ?? '',
      description:
        formValue.description || undefined,
      purchasePrice: Number(
        formValue.purchasePrice,
      ),
      salePrice: Number(
        formValue.salePrice,
      ),
      stock: Number(
        formValue.stock,
      ),
      minStock: Number(
        formValue.minStock,
      ),
      status:
        formValue.status === 'INACTIVE'
          ? 'INACTIVE' as const
          : 'ACTIVE' as const,
    };

    const editingId =
      this.editingProductId();

    if (editingId) {
      this.productsService.update(
        editingId,
        productData,
      ).subscribe({
        next: () => {
          this.closeForm();
          this.loadProducts();
        },

        error: (error) => {
          this.saving.set(false);

          if (error?.status === 409) {
            this.formError.set(
              'Ya existe un producto con ese SKU o código de barras.',
            );

            return;
          }

          if (error?.status === 404) {
            this.formError.set(
              'La categoría seleccionada no existe.',
            );

            return;
          }

          if (error?.status === 401) {
            this.formError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.formError.set(
            'No fue posible actualizar el producto.',
          );
        },
      });

      return;
    }

    this.productsService.create({
      barcode: formValue.barcode ?? '',
      sku: formValue.sku ?? '',
      name: formValue.name ?? '',
      brand: formValue.brand || undefined,
      categoryId: formValue.categoryId ?? '',
      description:
        formValue.description || undefined,
      purchasePrice: Number(
        formValue.purchasePrice,
      ),
      salePrice: Number(
        formValue.salePrice,
      ),
      stock: Number(
        formValue.stock,
      ),
      minStock: Number(
        formValue.minStock,
      ),
    }).subscribe({
      next: () => {
        this.closeForm();
        this.loadProducts();
      },

      error: (error) => {
        this.saving.set(false);

        if (error?.status === 409) {
          this.formError.set(
            'Ya existe un producto con ese SKU o código de barras.',
          );

          return;
        }

        if (error?.status === 404) {
          this.formError.set(
            'La categoría seleccionada no existe.',
          );

          return;
        }

        if (error?.status === 401) {
          this.formError.set(
            'Tu sesión ha expirado. Inicia sesión nuevamente.',
          );

          return;
        }

        this.formError.set(
          'No fue posible guardar el producto.',
        );
      },
    });
  }

  deleteProduct(product: Product): void {
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el producto "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingProductId.set(product._id);

    this.productsService
      .remove(product._id)
      .subscribe({
        next: () => {
          this.deletingProductId.set(null);

          this.loadProducts();
        },

        error: (error) => {
          this.deletingProductId.set(null);

          if (error?.status === 401) {
            this.error.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.error.set(
            'No fue posible eliminar el producto.',
          );
        },
      });
  }
}