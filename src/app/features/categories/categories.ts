
import {
  afterNextRender,
  Component,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  firstValueFrom,
} from 'rxjs';

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
  imports: [FormsModule],
  selector: 'app-categories',
  styleUrl: './categories.scss',
  templateUrl: './categories.html',
})
export class Categories {
  categories = signal<Category[]>([]);

  errorMessage = signal<string | null>(null);

  importing = signal(false);
  importError = signal('');
  importSummary = signal('');
  importErrors = signal<string[]>([]);

  showCreateForm = false;

  editingCategoryId: string | null = null;

  categoryName = '';
  categoryDescription = '';

  constructor(
    private readonly categoriesService: CategoriesService,
  ) {
    afterNextRender(() => {
      setTimeout(() => {
        this.loadCategories();
      }, 0);
    });
  }

  private loadCategories(): void {
    this.categoriesService.findAll().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },

      error: (error) => {
        console.error(
          'Error al cargar categorías:',
          error,
        );

        this.errorMessage.set(
          'No fue posible cargar las categorías.',
        );
      },
    });
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.editingCategoryId = null;

    this.categoryName = '';
    this.categoryDescription = '';

    this.errorMessage.set(null);
  }

  openEditForm(category: Category): void {
    this.showCreateForm = true;
    this.editingCategoryId = category._id;

    this.categoryName = category.name;
    this.categoryDescription =
      category.description ?? '';

    this.errorMessage.set(null);
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.editingCategoryId = null;

    this.categoryName = '';
    this.categoryDescription = '';

    this.errorMessage.set(null);
  }

  createCategory(): void {
    const name = this.categoryName.trim();

    this.errorMessage.set(null);

    if (!name) {
      this.errorMessage.set(
        'El nombre de la categoría es obligatorio.',
      );

      return;
    }

    const category = {
      name,
      description: this.categoryDescription.trim(),
    };

    this.categoriesService.create(category).subscribe({
      next: (newCategory) => {
        this.categories.update(
          (categories) => [
            ...categories,
            newCategory,
          ],
        );

        this.closeCreateForm();
      },

      error: (error) => {
        console.error(
          'Error al crear categoría:',
          error,
        );

        if (error.status === 409) {
          this.errorMessage.set(
            'Ya existe una categoría con ese nombre.',
          );

          return;
        }

        this.errorMessage.set(
          'No fue posible crear la categoría.',
        );
      },
    });
  }

  updateCategory(): void {
    if (!this.editingCategoryId) {
      return;
    }

    const name = this.categoryName.trim();

    this.errorMessage.set(null);

    if (!name) {
      this.errorMessage.set(
        'El nombre de la categoría es obligatorio.',
      );

      return;
    }

    const category = {
      name,
      description: this.categoryDescription.trim(),
    };

    this.categoriesService
      .update(
        this.editingCategoryId,
        category,
      )
      .subscribe({
        next: (updatedCategory) => {
          this.categories.update(
            (categories) =>
              categories.map(
                (item) =>
                  item._id === this.editingCategoryId
                    ? updatedCategory
                    : item,
              ),
          );

          this.closeCreateForm();
        },

        error: (error) => {
          console.error(
            'Error al actualizar categoría:',
            error,
          );

          if (error.status === 409) {
            this.errorMessage.set(
              'Ya existe una categoría con ese nombre.',
            );

            return;
          }

          this.errorMessage.set(
            'No fue posible actualizar la categoría.',
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

    this.importing.set(true);

    try {
      const content = await file.text();
      const rows = this.parseCsv(content);

      if (rows.length < 2) {
        throw new Error(
          'El archivo está vacío o no contiene categorías.',
        );
      }

      const headers = rows[0].map(
        (header) => this.normalizeHeader(header),
      );

      const nameIndex = headers.findIndex(
        (header) =>
          ['name', 'nombre', 'categoria'].includes(header),
      );

      const descriptionIndex = headers.findIndex(
        (header) =>
          ['description', 'descripcion'].includes(header),
      );

      if (nameIndex === -1) {
        throw new Error(
          'No se encontró la columna obligatoria "name" o "nombre".',
        );
      }

      const existingCategories =
        await firstValueFrom(
          this.categoriesService.findAll(),
        );

      this.categories.set(existingCategories);

      const existingNames = new Set(
        existingCategories.map(
          (category) => this.normalizeValue(category.name),
        ),
      );

      let created = 0;
      let skipped = 0;

      const errors: string[] = [];

      for (let index = 1; index < rows.length; index++) {
        const row = rows[index];

        if (row.every((value) => !value.trim())) {
          continue;
        }

        const rowNumber = index + 1;
        const name = (row[nameIndex] ?? '').trim();
        const description =
          descriptionIndex >= 0
            ? (row[descriptionIndex] ?? '').trim()
            : '';

        if (!name) {
          skipped++;
          errors.push(
            `Fila ${rowNumber}: el nombre de la categoría es obligatorio.`,
          );
          continue;
        }

        const normalizedName = this.normalizeValue(name);

        if (existingNames.has(normalizedName)) {
          skipped++;
          errors.push(
            `Fila ${rowNumber}: la categoría "${name}" ya existe. No se modificó.`,
          );
          continue;
        }

        try {
          const newCategory = await firstValueFrom(
            this.categoriesService.create({
              name,
              description,
            }),
          );

          existingNames.add(normalizedName);

          this.categories.update(
            (categories) => [
              ...categories,
              newCategory,
            ],
          );

          created++;
        } catch (error: unknown) {
          skipped++;

          const httpError = error as {
            status?: number;
          };

          if (httpError?.status === 409) {
            existingNames.add(normalizedName);

            errors.push(
              `Fila ${rowNumber}: la categoría "${name}" ya existe. No se modificó.`,
            );
          } else {
            errors.push(
              `Fila ${rowNumber}: no fue posible crear la categoría "${name}".`,
            );
          }
        }
      }

      this.importErrors.set(errors);
      this.importSummary.set(
        `Importación finalizada. Categorías creadas: ${created}. Filas omitidas: ${skipped}.`,
      );
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
      .replace(/[\s_-]+/g, '');
  }

  private normalizeValue(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  deleteCategory(category: Category): void {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar la categoría "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.categoriesService
      .remove(category._id)
      .subscribe({
        next: () => {
          this.categories.update(
            (categories) =>
              categories.filter(
                (item) => item._id !== category._id,
              ),
          );
        },

        error: (error) => {
          console.error(
            'Error al eliminar categoría:',
            error,
          );

          this.errorMessage.set(
            'No fue posible eliminar la categoría.',
          );
        },
      });
  }
}
