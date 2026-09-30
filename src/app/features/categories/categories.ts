import {
  afterNextRender,
  Component,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import { CategoriesService } from '../../core/services/categories.service';

@Component({
  imports: [FormsModule],
  selector: 'app-categories',
  styleUrl: './categories.scss',
  templateUrl: './categories.html',
})
export class Categories {
  categories = signal<any[]>([]);

  errorMessage = signal<string | null>(null);

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

  openEditForm(category: any): void {
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
                  item._id ===
                  this.editingCategoryId
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

  deleteCategory(category: any): void {
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
                (item) =>
                  item._id !== category._id,
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