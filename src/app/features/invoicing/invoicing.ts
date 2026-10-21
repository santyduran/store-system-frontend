import {
  CurrencyPipe,
  DatePipe,
} from '@angular/common';

import {
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';

import {
  InvoicesService,
  Invoice,
  InvoiceDetail,
} from '../../core/services/invoices.service';

@Component({
  selector: 'app-invoicing',
  templateUrl: './invoicing.html',
  styleUrl: './invoicing.scss',
  imports: [
    CurrencyPipe,
    DatePipe,
  ],
})
export class Invoicing implements OnInit, OnDestroy {
  invoices = signal<Invoice[]>([]);

  selectedInvoice =
    signal<InvoiceDetail | null>(null);

  loading = signal(false);

  detailLoading = signal(false);

  pdfLoading = signal(false);

  qrLoading = signal(false);

  error = signal('');

  detailError = signal('');

  pdfError = signal('');

  qrError = signal('');

  qrImageUrl = signal<string | null>(null);

  private currentQrObjectUrl: string | null = null;

  constructor(
    private readonly invoicesService:
      InvoicesService,
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  ngOnDestroy(): void {
    this.releaseQrImageUrl();
  }

  loadInvoices(): void {
    this.loading.set(true);

    this.error.set('');

    this.invoicesService
      .findAll()
      .subscribe({
        next: (invoices) => {
          this.invoices.set(invoices);

          this.loading.set(false);
        },

        error: (error) => {
          console.error(
            'Error al cargar las facturas:',
            error,
          );

          this.error.set(
            'No se pudieron cargar las facturas.',
          );

          this.loading.set(false);
        },
      });
  }

  viewInvoice(id: string): void {
    this.detailLoading.set(true);

    this.detailError.set('');

    this.qrError.set('');

    this.qrLoading.set(false);

    this.qrImageUrl.set(null);

    this.releaseQrImageUrl();

    this.selectedInvoice.set(null);

    this.invoicesService
      .findOne(id)
      .subscribe({
        next: (invoice) => {
          this.selectedInvoice.set(invoice);

          this.detailLoading.set(false);

          if (invoice.qrCode?.trim()) {
            this.loadInvoiceQr(invoice._id);
          }
        },

        error: (error) => {
          console.error(
            'Error al cargar el detalle de la factura:',
            error,
          );

          this.detailError.set(
            'No se pudo cargar el detalle de la factura.',
          );

          this.detailLoading.set(false);
        },
      });
  }

  private loadInvoiceQr(id: string): void {
    this.qrLoading.set(true);

    this.qrError.set('');

    this.invoicesService
      .getQr(id)
      .subscribe({
        next: (blob) => {
          if (!blob || blob.size === 0) {
            this.qrError.set(
              'El servidor no devolvió una imagen QR válida.',
            );

            this.qrLoading.set(false);

            return;
          }

          this.releaseQrImageUrl();

          const imageUrl =
            URL.createObjectURL(blob);

          this.currentQrObjectUrl = imageUrl;

          this.qrImageUrl.set(imageUrl);

          this.qrLoading.set(false);
        },

        error: (error) => {
          console.error(
            'Error al cargar el código QR de la factura:',
            error,
          );

          this.qrError.set(
            'No fue posible cargar el código QR de esta factura.',
          );

          this.qrLoading.set(false);
        },
      });
  }

  private releaseQrImageUrl(): void {
    if (this.currentQrObjectUrl) {
      URL.revokeObjectURL(
        this.currentQrObjectUrl,
      );

      this.currentQrObjectUrl = null;
    }
  }

  viewPdf(id: string): void {
    this.openInvoicePdf(id);
  }

  printInvoice(id: string): void {
    this.openInvoicePdf(id);
  }

  private openInvoicePdf(
    id: string,
  ): void {
    this.pdfLoading.set(true);

    this.pdfError.set('');

    /*
     * Abrimos la pestaña inmediatamente para evitar
     * que el navegador bloquee la apertura después
     * de terminar la petición HTTP.
     */
    const pdfWindow =
      window.open(
        '',
        '_blank',
      );

    if (!pdfWindow) {
      this.pdfError.set(
        'El navegador bloqueó la apertura del PDF. Permite las ventanas emergentes para este sitio.',
      );

      this.pdfLoading.set(false);

      return;
    }

    pdfWindow.document.write(
      `
        <html>
          <head>
            <title>Factura</title>
          </head>

          <body
            style="
              font-family: Arial, sans-serif;
              padding: 20px;
              text-align: center;
            "
          >
            <p>
              Generando factura...
            </p>
          </body>
        </html>
      `,
    );

    this.invoicesService
      .getPdf(id)
      .subscribe({
        next: (blob) => {
          const pdfUrl =
            URL.createObjectURL(blob);

          pdfWindow.location.href =
            pdfUrl;

          /*
           * Liberamos la URL después de un tiempo
           * para evitar consumir memoria innecesariamente.
           */
          setTimeout(() => {
            URL.revokeObjectURL(
              pdfUrl,
            );
          }, 60000);

          this.pdfLoading.set(false);
        },

        error: (error) => {
          console.error(
            'Error al generar el PDF de la factura:',
            error,
          );

          pdfWindow.close();

          this.pdfError.set(
            'No se pudo generar el PDF de la factura.',
          );

          this.pdfLoading.set(false);
        },
      });
  }

  closeDetail(): void {
    this.selectedInvoice.set(null);

    this.detailError.set('');

    this.qrError.set('');

    this.qrLoading.set(false);

    this.qrImageUrl.set(null);

    this.releaseQrImageUrl();
  }
}