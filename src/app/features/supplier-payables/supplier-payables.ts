
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SupplierInvoice,
  SupplierInvoicePaymentMethod,
  SupplierInvoicesService,
} from '../../core/services/supplier-invoices.service';

type PayableTab = 'PENDING' | 'OVERDUE' | 'PAID';

@Component({
  selector: 'app-supplier-payables',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './supplier-payables.html',
  styleUrl: './supplier-payables.scss',
})
export class SupplierPayables implements OnInit {
  readonly loading = signal(false);
  readonly savingPayment = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly invoices = signal<SupplierInvoice[]>([]);
  readonly summary = signal<{
    pending: { count: number; total: number };
    overdue: { count: number; total: number };
    paid: { count: number; total: number };
    outstandingCount: number;
    outstandingTotal: number;
  } | null>(null);
  readonly activeTab = signal<PayableTab>('PENDING');
  readonly showPaymentForm = signal(false);
  readonly selectedInvoice = signal<SupplierInvoice | null>(null);

  readonly uploadingAttachmentId = signal('');
  readonly openingAttachmentId = signal('');

  paymentMethod: SupplierInvoicePaymentMethod = 'TRANSFER';
  paymentDate = new Date().toISOString().slice(0, 10);
  paymentObservations = '';

  constructor(
    private readonly supplierInvoicesService: SupplierInvoicesService,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.error.set('');
    this.success.set('');

    this.supplierInvoicesService.getPayablesSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => this.summary.set(null),
    });

    this.loadInvoices();
  }

  selectTab(tab: PayableTab): void {
    this.activeTab.set(tab);
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);
    this.error.set('');

    const request = this.activeTab() === 'PENDING'
      ? this.supplierInvoicesService.findPendingPayables()
      : this.activeTab() === 'OVERDUE'
        ? this.supplierInvoicesService.findOverduePayables()
        : this.supplierInvoicesService.findPaidPayables();

    request.subscribe({
      next: (invoices) => {
        this.invoices.set(invoices);
        this.loading.set(false);
      },
      error: (error) => {
        this.invoices.set([]);
        this.loading.set(false);
        this.error.set(
          error?.error?.message || 'No fue posible cargar las facturas.',
        );
      },
    });
  }

  onAttachmentSelected(invoice: SupplierInvoice, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      this.error.set('Selecciona un PDF o una imagen JPG, PNG o WEBP.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error.set('El archivo no puede superar los 5 MB.');
      input.value = '';
      return;
    }

    this.error.set('');
    this.success.set('');
    this.uploadingAttachmentId.set(invoice._id);

    this.supplierInvoicesService
      .uploadAttachment(invoice._id, file)
      .subscribe({
        next: (updatedInvoice) => {
          this.invoices.update((current) =>
            current.map((item) =>
              item._id === invoice._id
                ? { ...item, ...updatedInvoice }
                : item,
            ),
          );

          this.uploadingAttachmentId.set('');
          this.success.set('Soporte adjuntado correctamente.');
          input.value = '';
        },
        error: (error) => {
          this.uploadingAttachmentId.set('');
          this.error.set(
            error?.error?.message ||
              'No fue posible adjuntar el archivo.',
          );
          input.value = '';
        },
      });
  }

  openAttachment(invoice: SupplierInvoice): void {
    if (!invoice.attachment) {
      this.error.set('Esta factura no tiene un soporte adjunto.');
      return;
    }

    this.error.set('');
    this.success.set('');

    const attachmentWindow = window.open('', '_blank');

    if (!attachmentWindow) {
      this.error.set(
        'El navegador bloqueó la ventana. Permite las ventanas emergentes e inténtalo de nuevo.',
      );
      return;
    }

    attachmentWindow.document.title = 'Abriendo soporte...';
    attachmentWindow.document.body.textContent = 'Cargando soporte...';

    this.openingAttachmentId.set(invoice._id);

    this.http
      .get(this.supplierInvoicesService.getAttachmentUrl(invoice._id), {
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          attachmentWindow.location.href = objectUrl;
          this.openingAttachmentId.set('');

          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        },
        error: (error) => {
          attachmentWindow.close();
          this.openingAttachmentId.set('');
          this.error.set(
            error?.error?.message ||
              'No fue posible abrir el soporte adjunto.',
          );
        },
      });
  }

  openPaymentForm(invoice: SupplierInvoice): void {
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      return;
    }

    this.selectedInvoice.set(invoice);
    this.paymentMethod = 'TRANSFER';
    this.paymentDate = new Date().toISOString().slice(0, 10);
    this.paymentObservations = '';
    this.error.set('');
    this.showPaymentForm.set(true);
  }

  closePaymentForm(): void {
    if (this.savingPayment()) {
      return;
    }

    this.showPaymentForm.set(false);
    this.selectedInvoice.set(null);
  }

  registerPayment(): void {
    const invoice = this.selectedInvoice();

    if (!invoice || !this.paymentDate || !this.paymentMethod) {
      this.error.set('Completa los datos del pago.');
      return;
    }

    this.savingPayment.set(true);
    this.error.set('');

    this.supplierInvoicesService.pay(invoice._id, {
      paymentMethod: this.paymentMethod,
      paymentDate: new Date(`${this.paymentDate}T12:00:00`).toISOString(),
      observations: this.paymentObservations.trim() || undefined,
    }).subscribe({
      next: () => {
        this.savingPayment.set(false);
        this.showPaymentForm.set(false);
        this.selectedInvoice.set(null);
        this.success.set('Pago registrado correctamente.');
        this.loadData();
      },
      error: (error) => {
        this.savingPayment.set(false);
        this.error.set(
          error?.error?.message || 'No fue posible registrar el pago.',
        );
      },
    });
  }

  getProviderName(invoice: SupplierInvoice): string {
    const provider = invoice.providerId;

    return typeof provider === 'string'
      ? 'Proveedor no disponible'
      : provider?.businessName || 'Proveedor sin nombre';
  }

  getProviderNit(invoice: SupplierInvoice): string {
    const provider = invoice.providerId;

    if (typeof provider === 'string') {
      return '—';
    }

    return provider?.verificationDigit
      ? `${provider.nit}-${provider.verificationDigit}`
      : provider?.nit || '—';
  }

  getPurchaseNumber(invoice: SupplierInvoice): string {
    const purchase = invoice.purchaseId;

    return typeof purchase === 'string'
      ? '—'
      : purchase?.purchaseNumber || '—';
  }

  getStatusLabel(status: SupplierInvoice['status']): string {
    const labels: Record<SupplierInvoice['status'], string> = {
      PENDING: 'Pendiente',
      OVERDUE: 'Vencida',
      PAID: 'Pagada',
      CANCELLED: 'Anulada',
    };

    return labels[status];
  }

  getPaymentMethodLabel(method?: SupplierInvoicePaymentMethod): string {
    const labels: Record<SupplierInvoicePaymentMethod, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
    };

    return method ? labels[method] : '—';
  }
}
