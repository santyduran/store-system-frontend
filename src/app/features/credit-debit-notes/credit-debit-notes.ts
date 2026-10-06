import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  CurrencyPipe,
  DatePipe,
} from '@angular/common';

import {
  CreditDebitNotesService,
  CreditNote,
  CreditNoteDetail,
  DebitNote,
  DebitNoteDetail,
  CreateCreditNote,
  CreateDebitNote,
  CreditDebitNoteItem,
} from '../../core/services/credit-debit-notes.service';

import {
  InvoicesService,
  Invoice,
  InvoiceDetail,
  InvoiceItem,
} from '../../core/services/invoices.service';

type NoteType =
  | 'CREDIT'
  | 'DEBIT';

@Component({
  selector: 'app-credit-debit-notes',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl:
    './credit-debit-notes.html',
  styleUrl:
    './credit-debit-notes.scss',
})
export class CreditDebitNotes
  implements OnInit {

  readonly selectedType =
    signal<NoteType>('CREDIT');

  readonly creditNotes =
    signal<CreditNote[]>([]);

  readonly debitNotes =
    signal<DebitNote[]>([]);

  readonly selectedCreditNote =
    signal<CreditNoteDetail | null>(
      null,
    );

  readonly selectedDebitNote =
    signal<DebitNoteDetail | null>(
      null,
    );

  readonly loading =
    signal(false);

  readonly error =
    signal('');

  readonly detailLoading =
    signal(false);

  readonly detailError =
    signal('');

  /*
   * Estado para crear una nueva nota.
   */
  readonly createModalOpen =
    signal(false);

  readonly createInvoices =
    signal<Invoice[]>([]);

  readonly createInvoiceDetail =
    signal<InvoiceDetail | null>(null);

  readonly createLoading =
    signal(false);

  readonly createInvoicesLoading =
    signal(false);

  readonly createError =
    signal('');

  readonly createSuccess =
    signal('');

  readonly selectedInvoiceId =
    signal('');

  readonly selectedProductId =
    signal('');

  readonly selectedQuantity =
    signal(1);

  readonly createReason =
    signal('');

  /*
   * Estado para cancelar una nota.
   */
  readonly cancelModalOpen =
    signal(false);

  readonly cancelLoading =
    signal(false);

  readonly cancelError =
    signal('');

  readonly cancelReason =
    signal('');

  readonly cancelNoteType =
    signal<NoteType | null>(null);

  readonly cancelNoteId =
    signal('');

  readonly cancelNoteNumber =
    signal('');

  constructor(
    private readonly creditDebitNotesService:
      CreditDebitNotesService,

    private readonly invoicesService:
      InvoicesService,
  ) {}

  ngOnInit(): void {
    this.loadNotes();
  }

  setType(
    type: NoteType,
  ): void {
    this.selectedType.set(type);

    this.closeDetail();

    this.loadNotes();
  }

  loadNotes(): void {
    this.loading.set(true);
    this.error.set('');

    if (
      this.selectedType() ===
      'CREDIT'
    ) {
      this.creditDebitNotesService
        .findCreditNotes()
        .subscribe({
          next: (notes) => {
            this.creditNotes.set(notes);
            this.loading.set(false);
          },

          error: (error) => {
            console.error(
              'Error cargando notas crédito:',
              error,
            );

            this.creditNotes.set([]);

            this.error.set(
              'No fue posible cargar las notas crédito.',
            );

            this.loading.set(false);
          },
        });

      return;
    }

    this.creditDebitNotesService
      .findDebitNotes()
      .subscribe({
        next: (notes) => {
          this.debitNotes.set(notes);
          this.loading.set(false);
        },

        error: (error) => {
          console.error(
            'Error cargando notas débito:',
            error,
          );

          this.debitNotes.set([]);

          this.error.set(
            'No fue posible cargar las notas débito.',
          );

          this.loading.set(false);
        },
      });
  }

  viewCreditNote(
    id: string,
  ): void {
    this.detailLoading.set(true);
    this.detailError.set('');

    this.creditDebitNotesService
      .findCreditNote(id)
      .subscribe({
        next: (note) => {
          this.selectedCreditNote.set(
            note,
          );

          this.detailLoading.set(false);
        },

        error: (error) => {
          console.error(
            'Error cargando detalle de nota crédito:',
            error,
          );

          this.detailLoading.set(false);

          this.detailError.set(
            'No fue posible cargar el detalle de la nota crédito.',
          );
        },
      });
  }

  viewDebitNote(
    id: string,
  ): void {
    this.detailLoading.set(true);
    this.detailError.set('');

    this.creditDebitNotesService
      .findDebitNote(id)
      .subscribe({
        next: (note) => {
          this.selectedDebitNote.set(
            note,
          );

          this.detailLoading.set(false);
        },

        error: (error) => {
          console.error(
            'Error cargando detalle de nota débito:',
            error,
          );

          this.detailLoading.set(false);

          this.detailError.set(
            'No fue posible cargar el detalle de la nota débito.',
          );
        },
      });
  }

  closeDetail(): void {
    this.selectedCreditNote.set(
      null,
    );

    this.selectedDebitNote.set(
      null,
    );

    this.detailError.set('');
    this.detailLoading.set(false);
  }

  /*
   * Abre el formulario para crear
   * una nueva nota crédito o débito.
   */
  openCreateNote(): void {
    this.createModalOpen.set(true);

    this.createInvoices.set([]);
    this.createInvoiceDetail.set(null);

    this.selectedInvoiceId.set('');
    this.selectedProductId.set('');
    this.selectedQuantity.set(1);
    this.createReason.set('');

    this.createError.set('');
    this.createSuccess.set('');

    this.loadCreateInvoices();
  }

  /*
   * Cierra el formulario de creación.
   */
  closeCreateNote(): void {
    this.createModalOpen.set(false);

    this.createInvoices.set([]);
    this.createInvoiceDetail.set(null);

    this.selectedInvoiceId.set('');
    this.selectedProductId.set('');
    this.selectedQuantity.set(1);
    this.createReason.set('');

    this.createError.set('');
    this.createSuccess.set('');
    this.createLoading.set(false);
    this.createInvoicesLoading.set(false);
  }

  /*
   * Carga las facturas disponibles para
   * relacionarlas con la nueva nota.
   */
  loadCreateInvoices(): void {
    this.createInvoicesLoading.set(true);
    this.createError.set('');

    this.invoicesService
      .findAll()
      .subscribe({
        next: (invoices) => {
          this.createInvoices.set(
            invoices.filter(
              (invoice) =>
                invoice.status !==
                'CANCELLED',
            ),
          );

          this.createInvoicesLoading.set(
            false,
          );
        },

        error: (error) => {
          console.error(
            'Error cargando facturas para la nota:',
            error,
          );

          this.createInvoices.set([]);

          this.createInvoicesLoading.set(
            false,
          );

          this.createError.set(
            'No fue posible cargar las facturas disponibles.',
          );
        },
      });
  }

  /*
   * Se ejecuta cuando el usuario
   * selecciona una factura.
   */
  onInvoiceSelected(
    invoiceId: string,
  ): void {
    this.selectedInvoiceId.set(
      invoiceId,
    );

    this.createInvoiceDetail.set(null);
    this.selectedProductId.set('');
    this.selectedQuantity.set(1);
    this.createError.set('');

    if (!invoiceId) {
      return;
    }

    this.createLoading.set(true);

    this.invoicesService
      .findOne(invoiceId)
      .subscribe({
        next: (invoice) => {
          this.createInvoiceDetail.set(
            invoice,
          );

          this.createLoading.set(false);
        },

        error: (error) => {
          console.error(
            'Error cargando detalle de factura:',
            error,
          );

          this.createInvoiceDetail.set(
            null,
          );

          this.createLoading.set(false);

          this.createError.set(
            'No fue posible cargar los productos de la factura.',
          );
        },
      });
  }

  /*
   * Se ejecuta cuando el usuario
   * selecciona un producto.
   */
  onProductSelected(
    productId: string,
  ): void {
    this.selectedProductId.set(
      productId,
    );

    this.selectedQuantity.set(1);
  }

  /*
   * Obtiene el producto seleccionado
   * dentro de la factura.
   */
  get selectedInvoiceItem():
    InvoiceItem | null {

    const invoice =
      this.createInvoiceDetail();

    if (!invoice) {
      return null;
    }

    const productId =
      this.selectedProductId();

    if (!productId) {
      return null;
    }

    return (
      invoice.items.find(
        (item) =>
          this.getProductId(item) ===
          productId,
      ) ?? null
    );
  }

  /*
   * Obtiene el ID del producto tanto
   * si viene como string como si viene
   * poblado desde MongoDB.
   */
  getProductId(
    item: InvoiceItem | CreditDebitNoteItem,
  ): string {

    if (
      typeof item.productId ===
      'string'
    ) {
      return item.productId;
    }

    return item.productId._id;
  }

  /*
   * Actualiza la cantidad seleccionada.
   */
  onQuantityChanged(
    quantity: number,
  ): void {

    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      this.selectedQuantity.set(1);
      return;
    }

    this.selectedQuantity.set(
      Math.floor(quantity),
    );
  }

  /*
   * Actualiza el motivo.
   */
  onReasonChanged(
    reason: string,
  ): void {
    this.createReason.set(
      reason,
    );
  }

  /*
   * Crea la nota crédito o débito
   * según la pestaña seleccionada.
   */
  createNote(): void {
    this.createError.set('');
    this.createSuccess.set('');

    const invoiceId =
      this.selectedInvoiceId();

    const productId =
      this.selectedProductId();

    const quantity =
      this.selectedQuantity();

    const reason =
      this.createReason().trim();

    if (!invoiceId) {
      this.createError.set(
        'Debes seleccionar una factura.',
      );

      return;
    }

    if (!productId) {
      this.createError.set(
        'Debes seleccionar un producto.',
      );

      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      this.createError.set(
        'La cantidad debe ser un número entero mayor que cero.',
      );

      return;
    }

    if (!reason) {
      this.createError.set(
        'Debes ingresar el motivo de la nota.',
      );

      return;
    }

    const items = [
      {
        productId,
        quantity,
      },
    ];

    this.createLoading.set(true);

    if (
      this.selectedType() ===
      'CREDIT'
    ) {
      const payload:
        CreateCreditNote = {
        invoiceId,
        reason,
        items,
      };

      this.creditDebitNotesService
        .createCreditNote(payload)
        .subscribe({
          next: () => {
            this.createLoading.set(false);

            this.createSuccess.set(
              'Nota crédito creada correctamente.',
            );

            this.loadNotes();

            setTimeout(() => {
              this.closeCreateNote();
            }, 800);
          },

          error: (error) => {
            console.error(
              'Error creando nota crédito:',
              error,
            );

            this.createLoading.set(false);

            this.createError.set(
              this.getCreateErrorMessage(
                error,
                'No fue posible crear la nota crédito.',
              ),
            );
          },
        });

      return;
    }

    const payload:
      CreateDebitNote = {
      invoiceId,
      reason,
      items,
    };

    this.creditDebitNotesService
      .createDebitNote(payload)
      .subscribe({
        next: () => {
          this.createLoading.set(false);

          this.createSuccess.set(
            'Nota débito creada correctamente.',
          );

          this.loadNotes();

          setTimeout(() => {
            this.closeCreateNote();
          }, 800);
        },

        error: (error) => {
          console.error(
            'Error creando nota débito:',
            error,
          );

          this.createLoading.set(false);

          this.createError.set(
            this.getCreateErrorMessage(
              error,
              'No fue posible crear la nota débito.',
            ),
          );
        },
      });
  }

  /*
   * Abre el modal de cancelación.
   */
  openCancelNote(
    type: NoteType,
    id: string,
    noteNumber: string,
  ): void {
    this.cancelModalOpen.set(true);

    this.cancelLoading.set(false);
    this.cancelError.set('');

    this.cancelReason.set('');

    this.cancelNoteType.set(type);
    this.cancelNoteId.set(id);
    this.cancelNoteNumber.set(noteNumber);
  }

  /*
   * Cierra el modal de cancelación.
   */
  closeCancelNote(): void {
    this.cancelModalOpen.set(false);

    this.cancelLoading.set(false);
    this.cancelError.set('');

    this.cancelReason.set('');

    this.cancelNoteType.set(null);
    this.cancelNoteId.set('');
    this.cancelNoteNumber.set('');
  }

  /*
   * Actualiza el motivo de cancelación.
   */
  onCancelReasonChanged(
    reason: string,
  ): void {
    this.cancelReason.set(
      reason,
    );
  }

  /*
   * Cancela la nota crédito o débito
   * según el tipo seleccionado.
   */
  cancelNote(): void {
    this.cancelError.set('');

    const type =
      this.cancelNoteType();

    const id =
      this.cancelNoteId();

    const reason =
      this.cancelReason().trim();

    if (!type || !id) {
      this.cancelError.set(
        'No fue posible identificar la nota que deseas cancelar.',
      );

      return;
    }

    if (!reason) {
      this.cancelError.set(
        'Debes ingresar el motivo de la cancelación.',
      );

      return;
    }

    if (reason.length > 500) {
      this.cancelError.set(
        'El motivo de cancelación no puede superar los 500 caracteres.',
      );

      return;
    }

    this.cancelLoading.set(true);

    if (type === 'CREDIT') {
      this.creditDebitNotesService
        .cancelCreditNote(
          id,
          reason,
        )
        .subscribe({
          next: () => {
            this.cancelLoading.set(false);

            this.closeCancelNote();
            this.closeDetail();

            this.loadNotes();
          },

          error: (error) => {
            console.error(
              'Error cancelando nota crédito:',
              error,
            );

            this.cancelLoading.set(false);

            this.cancelError.set(
              this.getCancelErrorMessage(
                error,
                'No fue posible cancelar la nota crédito.',
              ),
            );
          },
        });

      return;
    }

    this.creditDebitNotesService
      .cancelDebitNote(
        id,
        reason,
      )
      .subscribe({
        next: () => {
          this.cancelLoading.set(false);

          this.closeCancelNote();
          this.closeDetail();

          this.loadNotes();
        },

        error: (error) => {
          console.error(
            'Error cancelando nota débito:',
            error,
          );

          this.cancelLoading.set(false);

          this.cancelError.set(
            this.getCancelErrorMessage(
              error,
              'No fue posible cancelar la nota débito.',
            ),
          );
        },
      });
  }

  /*
   * Convierte los errores conocidos
   * del backend en mensajes claros.
   */
  private getCreateErrorMessage(
    error: any,
    defaultMessage: string,
  ): string {

    const message =
      error?.error?.message;

    if (
      Array.isArray(message) &&
      message.length > 0
    ) {
      return message.join(', ');
    }

    if (
      typeof message ===
      'string' &&
      message.trim()
    ) {
      return message;
    }

    return defaultMessage;
  }

  /*
   * Convierte los errores de cancelación
   * del backend en mensajes claros.
   */
  private getCancelErrorMessage(
    error: any,
    defaultMessage: string,
  ): string {

    const message =
      error?.error?.message;

    if (
      Array.isArray(message) &&
      message.length > 0
    ) {
      return message.join(', ');
    }

    if (
      typeof message ===
      'string' &&
      message.trim()
    ) {
      return message;
    }

    return defaultMessage;
  }

  get currentCreditNotes():
    CreditNote[] {
    return this.creditNotes();
  }

  get currentDebitNotes():
    DebitNote[] {
    return this.debitNotes();
  }

  get currentNoteCount(): number {
    return this.selectedType() ===
      'CREDIT'
      ? this.creditNotes().length
      : this.debitNotes().length;
  }

  get currentNoteLabel(): string {
    return this.selectedType() ===
      'CREDIT'
      ? 'nota crédito'
      : 'nota débito';
  }

  get currentNoteLabelPlural(): string {
    return this.selectedType() ===
      'CREDIT'
      ? 'notas crédito'
      : 'notas débito';
  }
}