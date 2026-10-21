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
  firstValueFrom,
} from 'rxjs';
import {
  ProductsService,
  Product,
} from '../../core/services/products.service';
import {
  CategoriesService,
} from '../../core/services/categories.service';
import {
  ProvidersService,
  Provider,
} from '../../core/services/providers.service';

interface Category {
  _id: string;
  name: string;
  description?: string;
  status: string;
}

interface CsvProduct {
  barcode: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  minStock: number;
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
  providers = signal<Provider[]>([]);

  loading = signal(true);
  error = signal('');

  showForm = signal(false);
  formError = signal('');
  saving = signal(false);

  editingProductId = signal<string | null>(null);
  deletingProductId = signal<string | null>(null);

  importing = signal(false);
  importError = signal('');
  importSummary = signal('');
  importErrors = signal<string[]>([]);

  productForm;

  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly providersService: ProvidersService,
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
      providerId: [
        '',
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
    this.loadProviders();
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

  loadProviders(): void {
    this.providersService.findActive().subscribe({
      next: (providers) => {
        this.providers.set(providers);
      },
      error: () => {
        this.providers.set([]);
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
      providerId: '',
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

    const providerId =
      product.provider && typeof product.provider === 'object'
        ? product.provider._id
        : typeof product.provider === 'string'
          ? product.provider
          : '';

    this.productForm.reset({
      barcode: product.barcode,
      sku: product.sku,
      name: product.name,
      brand: product.brand ?? '',
      categoryId: product.category._id,
      providerId,
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
      providerId: '',
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
      providerId: formValue.providerId || undefined,
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
              'La categoría o el proveedor seleccionado no existe.',
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
      providerId: formValue.providerId || undefined,
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
      taxRate: 0,
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
            'La categoría o el proveedor seleccionado no existe.',
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

  async importCsv(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.importError.set('');
    this.importSummary.set('');
    this.importErrors.set([]);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.importError.set(
        'Selecciona un archivo con extensión .csv.',
      );
      input.value = '';
      return;
    }

    if (this.categories().length === 0) {
      this.importError.set(
        'No hay categorías cargadas. Verifica las categorías e inténtalo nuevamente.',
      );
      input.value = '';
      return;
    }

    this.importing.set(true);

    try {
      const content = await file.text();
      const rows = this.parseCsv(content);

      if (rows.length < 2) {
        throw new Error(
          'El archivo está vacío o no contiene productos.',
        );
      }

      const headers = rows[0].map(
        (header) => this.normalizeHeader(header),
      );

      const requiredHeaders = [
        'barcode',
        'sku',
        'name',
        'category',
        'purchaseprice',
        'saleprice',
        'minstock',
      ];

      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header),
      );

      if (missingHeaders.length > 0) {
        throw new Error(
          `Faltan columnas obligatorias: ${missingHeaders.join(', ')}.`,
        );
      }

      const existingProducts = this.products().length > 0
        ? this.products()
        : await firstValueFrom(
            this.productsService.findAll(),
          );

      const existingSkus = new Set(
        existingProducts
          .map((product) => this.normalizeValue(product.sku))
          .filter(Boolean),
      );

      const existingBarcodes = new Set(
        existingProducts
          .map((product) => this.normalizeValue(product.barcode))
          .filter(Boolean),
      );

      const seenSkus = new Set<string>();
      const seenBarcodes = new Set<string>();

      const categoryByName = new Map(
        this.categories().map((category) => [
          this.normalizeValue(category.name),
          category,
        ]),
      );

      const categoryById = new Map(
        this.categories().map((category) => [
          category._id,
          category,
        ]),
      );

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let index = 1; index < rows.length; index++) {
        const row = rows[index];

        if (row.every((value) => !value.trim())) {
          continue;
        }

        const rowNumber = index + 1;

        try {
          const getValue = (...names: string[]): string => {
            for (const name of names) {
              const columnIndex = headers.indexOf(
                this.normalizeHeader(name),
              );

              if (columnIndex >= 0) {
                return (row[columnIndex] ?? '').trim();
              }
            }

            return '';
          };

          const barcode = getValue('barcode', 'codigo de barras');
          const sku = getValue('sku');
          const name = getValue('name', 'nombre');
          const categoryValue = getValue(
            'category',
            'categoria',
            'categoryname',
            'nombre categoria',
            'categoryid',
            'categoriaid',
          );

          const purchasePrice = this.parseNumber(
            getValue('purchasePrice', 'precio compra'),
          );

          const salePrice = this.parseNumber(
            getValue('salePrice', 'precio venta'),
          );

          const minStock = this.parseNumber(
            getValue('minStock', 'stock minimo'),
          );

          if (!barcode || !sku || !name || !categoryValue) {
            throw new Error(
              'Código de barras, SKU, nombre y categoría son obligatorios.',
            );
          }

          const normalizedSku = this.normalizeValue(sku);
          const normalizedBarcode = this.normalizeValue(barcode);

          if (
            existingSkus.has(normalizedSku) ||
            existingBarcodes.has(normalizedBarcode) ||
            seenSkus.has(normalizedSku) ||
            seenBarcodes.has(normalizedBarcode)
          ) {
            skipped++;
            errors.push(
              `Fila ${rowNumber}: SKU o código de barras duplicado. No se modificó ningún producto existente.`,
            );
            continue;
          }

          if (
            purchasePrice === null ||
            salePrice === null ||
            minStock === null
          ) {
            throw new Error(
              'Los precios y el stock mínimo deben ser números válidos.',
            );
          }

          if (
            purchasePrice < 0 ||
            salePrice < 0 ||
            minStock < 0
          ) {
            throw new Error(
              'Los precios y el stock mínimo no pueden ser negativos.',
            );
          }

          if (
            !Number.isFinite(purchasePrice) ||
            !Number.isFinite(salePrice) ||
            !Number.isFinite(minStock)
          ) {
            throw new Error(
              'Hay valores numéricos fuera del rango permitido.',
            );
          }

          if (!Number.isInteger(minStock)) {
            throw new Error(
              'El stock mínimo debe ser un número entero.',
            );
          }

          const category =
            categoryById.get(categoryValue) ??
            categoryByName.get(
              this.normalizeValue(categoryValue),
            );

          if (!category) {
            throw new Error(
              `La categoría "${categoryValue}" no existe.`,
            );
          }

          const productData = {
            barcode,
            sku,
            name,
            brand: getValue('brand', 'marca') || undefined,
            categoryId: category._id,
            description: getValue(
              'description',
              'descripcion',
            ) || undefined,
            purchasePrice,
            salePrice,
            stock: 0,
            minStock,
            taxRate: 0,
          };

          await firstValueFrom(
            this.productsService.create(productData),
          );

          imported++;
          existingSkus.add(normalizedSku);
          existingBarcodes.add(normalizedBarcode);
          seenSkus.add(normalizedSku);
          seenBarcodes.add(normalizedBarcode);
        } catch (error: unknown) {
          skipped++;

          const message =
            error instanceof Error
              ? error.message
              : 'No fue posible importar este producto.';

          errors.push(
            `Fila ${rowNumber}: ${message}`,
          );
        }
      }

      this.importErrors.set(errors);
      this.importSummary.set(
        `Importación finalizada. Productos creados: ${imported}. Filas omitidas: ${skipped}.`,
      );

      if (imported > 0) {
        this.loadProducts();
      }
    } catch (error: unknown) {
      this.importError.set(
        error instanceof Error
          ? error.message
          : 'No fue posible leer el archivo CSV.',
      );
    } finally {
      this.importing.set(false);
      input.value = '';
    }
  }

  private parseCsv(content: string): string[][] {
    const text = content.replace(/^\uFEFF/, '');

    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    const commaCount = (firstLine.match(/,/g) ?? []).length;
    const semicolonCount = (firstLine.match(/;/g) ?? []).length;
    const delimiter = semicolonCount > commaCount ? ';' : ',';

    const rows: string[][] = [];
    let row: string[] = [];
    let value = '';
    let inQuotes = false;

    for (let index = 0; index < text.length; index++) {
      const char = text[index];

      if (char === '"') {
        if (inQuotes && text[index + 1] === '"') {
          value += '"';
          index++;
        } else {
          inQuotes = !inQuotes;
        }

        continue;
      }

      if (char === delimiter && !inQuotes) {
        row.push(value.trim());
        value = '';
        continue;
      }

      if (
        (char === '\n' || char === '\r') &&
        !inQuotes
      ) {
        if (char === '\r' && text[index + 1] === '\n') {
          index++;
        }

        row.push(value.trim());

        if (row.some((cell) => cell.length > 0)) {
          rows.push(row);
        }

        row = [];
        value = '';
        continue;
      }

      value += char;
    }

    if (inQuotes) {
      throw new Error(
        'El CSV contiene comillas sin cerrar.',
      );
    }

    if (value.length > 0 || row.length > 0) {
      row.push(value.trim());
      rows.push(row);
    }

    return rows;
  }

  private normalizeHeader(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s\_-]+/g, '');
  }

  private normalizeValue(value: string): string {
    return value.trim().toLowerCase();
  }

  private parseNumber(value: string): number | null {
    const normalized = value
      .trim()
      .replace(/\s/g, '')
      .replace(',', '.');

    if (!normalized) {
      return null;
    }

    const number = Number(normalized);

    return Number.isFinite(number) ? number : null;
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