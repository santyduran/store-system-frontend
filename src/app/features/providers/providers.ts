import { Component, signal, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Product, ProductsService } from '../../core/services/products.service';
import { Provider, ProvidersService } from '../../core/services/providers.service';

@Component({
  selector: 'app-providers',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './providers.html',
  styleUrl: './providers.scss'
})
export class Providers {
  providers = signal<Provider[]>([]);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  updatingStatus = signal<string | null>(null);

  selectedProvider = signal<Provider | null>(null);
  providerProducts = signal<Product[]>([]);
  loadingProducts = signal(false);
  productsError = signal<string | null>(null);

  showCreateForm = false;
  editingProviderId: string | null = null;
  loading = false;

  businessName = '';
  nit = '';
  verificationDigit = '';
  contactName = '';
  phone = '';
  email = '';
  address = '';
  city = '';
  bankName = '';
  bankAccountNumber = '';
  bankAccountType = '';

  constructor(
    private readonly providersService: ProvidersService,
    private readonly productsService: ProductsService
  ) {
    afterNextRender(() => {
      this.loadProviders();
    });
  }

  loadProviders(): void {
    this.loading = true;
    this.errorMessage.set(null);

    this.providersService.findAll().subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
        this.errorMessage.set(
          error.error?.message || 'No fue posible cargar los proveedores.'
        );
        this.loading = false;
      }
    });
  }

  selectProvider(provider: Provider): void {
    if (!provider._id) {
      this.productsError.set('No se encontró el identificador del proveedor.');
      return;
    }

    this.selectedProvider.set(provider);
    this.providerProducts.set([]);
    this.productsError.set(null);
    this.loadingProducts.set(true);

    this.productsService.findByProvider(provider._id).subscribe({
      next: (products) => {
        this.providerProducts.set(products);
        this.loadingProducts.set(false);
      },
      error: (error) => {
        console.error('Error al cargar productos del proveedor:', error);
        this.productsError.set(
          error.error?.message ||
            'No fue posible cargar los productos de este proveedor.'
        );
        this.loadingProducts.set(false);
      }
    });
  }

  clearSelectedProvider(): void {
    this.selectedProvider.set(null);
    this.providerProducts.set([]);
    this.productsError.set(null);
    this.loadingProducts.set(false);
  }

  openCreateForm(): void {
    this.resetForm();
    this.editingProviderId = null;
    this.showCreateForm = true;
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  openEditForm(provider: Provider): void {
    this.editingProviderId = provider._id ?? null;

    this.businessName = provider.businessName;
    this.nit = provider.nit;
    this.verificationDigit = provider.verificationDigit;
    this.contactName = provider.contactName ?? '';
    this.phone = provider.phone ?? '';
    this.email = provider.email ?? '';
    this.address = provider.address ?? '';
    this.city = provider.city ?? '';
    this.bankName = provider.bankName ?? '';
    this.bankAccountNumber = provider.bankAccountNumber ?? '';
    this.bankAccountType = provider.bankAccountType ?? '';

    this.showCreateForm = true;
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.editingProviderId = null;
    this.resetForm();
    this.errorMessage.set(null);
  }

  createProvider(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.providersService.create(this.buildProvider()).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage.set('Proveedor registrado correctamente.');
        this.closeCreateForm();
        this.loadProviders();
      },
      error: (error) => {
        console.error('Error al crear proveedor:', error);
        this.errorMessage.set(
          error.error?.message || 'No fue posible registrar el proveedor.'
        );
        this.loading = false;
      }
    });
  }

  updateProvider(): void {
    if (!this.editingProviderId || !this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.providersService
      .update(this.editingProviderId, this.buildProvider())
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage.set('Proveedor actualizado correctamente.');
          this.closeCreateForm();
          this.loadProviders();
        },
        error: (error) => {
          console.error('Error al actualizar proveedor:', error);
          this.errorMessage.set(
            error.error?.message || 'No fue posible actualizar el proveedor.'
          );
          this.loading = false;
        }
      });
  }

  updateProviderStatus(provider: Provider): void {
    if (!provider._id || this.updatingStatus() !== null) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    const newStatus: 'ACTIVE' | 'INACTIVE' =
      provider.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    this.updatingStatus.set(provider._id);

    this.providersService
      .update(provider._id, { status: newStatus })
      .subscribe({
        next: (updatedProvider) => {
          this.providers.update((providers) =>
            providers.map((currentProvider) =>
              currentProvider._id === updatedProvider._id
                ? updatedProvider
                : currentProvider
            )
          );

          this.updatingStatus.set(null);
          this.successMessage.set(
            newStatus === 'ACTIVE'
              ? 'Proveedor activado correctamente.'
              : 'Proveedor desactivado correctamente.'
          );
        },
        error: (error) => {
          console.error('Error al cambiar el estado del proveedor:', error);
          this.updatingStatus.set(null);
          this.errorMessage.set(
            error.error?.message ||
              'No fue posible cambiar el estado del proveedor.'
          );
        }
      });
  }

  deleteProvider(provider: Provider): void {
    if (!provider._id) {
      this.errorMessage.set('No se encontró el identificador del proveedor.');
      return;
    }

    const confirmed = confirm(
      `¿Deseas desactivar al proveedor "${provider.businessName}"?`
    );

    if (!confirmed) {
      return;
    }

    this.loading = true;
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.providersService.remove(provider._id).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage.set('Proveedor desactivado correctamente.');

        if (this.selectedProvider()?._id === provider._id) {
          this.clearSelectedProvider();
        }

        this.loadProviders();
      },
      error: (error) => {
        console.error('Error al desactivar proveedor:', error);
        this.errorMessage.set(
          error.error?.message || 'No fue posible desactivar el proveedor.'
        );
        this.loading = false;
      }
    });
  }

  private buildProvider(): Provider {
    return {
      businessName: this.businessName.trim(),
      nit: this.nit.trim(),
      verificationDigit: this.verificationDigit.trim(),
      contactName: this.contactName.trim(),
      phone: this.phone.trim(),
      email: this.email.trim(),
      address: this.address.trim(),
      city: this.city.trim(),
      bankName: this.bankName.trim(),
      bankAccountNumber: this.bankAccountNumber.trim(),
      bankAccountType: this.bankAccountType.trim()
    };
  }

  private validateForm(): boolean {
    if (!this.businessName.trim()) {
      this.errorMessage.set('La razón social o nombre es obligatorio.');
      return false;
    }

    if (!this.nit.trim()) {
      this.errorMessage.set('El NIT es obligatorio.');
      return false;
    }

    if (!this.verificationDigit.trim()) {
      this.errorMessage.set('El dígito de verificación es obligatorio.');
      return false;
    }

    if (
      this.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())
    ) {
      this.errorMessage.set('Ingresa un correo electrónico válido.');
      return false;
    }

    this.errorMessage.set(null);
    return true;
  }

  private resetForm(): void {
    this.businessName = '';
    this.nit = '';
    this.verificationDigit = '';
    this.contactName = '';
    this.phone = '';
    this.email = '';
    this.address = '';
    this.city = '';
    this.bankName = '';
    this.bankAccountNumber = '';
    this.bankAccountType = '';
  }
}