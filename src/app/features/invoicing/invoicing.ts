import {
  CurrencyPipe,
  DatePipe,
} from '@angular/common';

import {
  Component,
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
export class Invoicing implements OnInit {
  invoices = signal<Invoice[]>([]);

  selectedInvoice =
    signal<InvoiceDetail | null>(null);

  loading = signal(false);

  detailLoading = signal(false);

  pdfLoading = signal(false);

  error = signal('');

  detailError = signal('');

  pdfError = signal('');

  constructor(
    private readonly invoicesService:
      InvoicesService,
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
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

    this.selectedInvoice.set(null);

    console.log(
      'ID de factura seleccionado:',
      id,
    );

    this.invoicesService
      .findOne(id)
      .subscribe({
        next: (invoice) => {
          console.log(
            'Factura recibida:',
            invoice,
          );

          this.selectedInvoice.set(invoice);

          console.log(
            'Factura seleccionada:',
            this.selectedInvoice(),
          );

          this.detailLoading.set(false);
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
  }
}