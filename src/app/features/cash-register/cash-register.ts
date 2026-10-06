import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  DecimalPipe,
} from '@angular/common';

import {
  FormsModule,
} from '@angular/forms';

import {
  CashMovement,
  CashRegister,
  CashRegisterService,
} from '../../core/services/cash-register.service';

@Component({
  selector: 'app-cash-register',
  imports: [
    DecimalPipe,
    FormsModule,
  ],
  templateUrl: './cash-register.html',
  styleUrl: './cash-register.scss',
})
export class CashRegisterComponent
  implements OnInit
{
  cashRegister =
    signal<CashRegister | null>(null);

  movements =
    signal<CashMovement[]>([]);

  loading = signal(true);

  movementsLoading = signal(false);

  error = signal('');

  movementsError = signal('');

  openingAmount =
    signal<number | null>(null);

  openingCash = signal(false);

  openCashError = signal('');

  countedCash =
    signal<number | null>(null);

  closingCash = signal(false);

  closeCashError = signal('');

  cashEntryAmount =
    signal<number | null>(null);

  cashEntryDescription =
    signal('');

  cashEntryLoading = signal(false);

  cashEntryError = signal('');

  cashEntrySuccess = signal('');

  cashExitAmount =
    signal<number | null>(null);

  cashExitDescription =
    signal('');

  cashExitLoading = signal(false);

  cashExitError = signal('');

  cashExitSuccess = signal('');

  ngOnInit(): void {
    this.loadCurrentCashRegister();
  }

  constructor(
    private readonly cashRegisterService:
      CashRegisterService,
  ) {}

  loadCurrentCashRegister(): void {
    this.loading.set(true);

    this.error.set('');

    this.cashRegisterService
      .getCurrent()
      .subscribe({
        next: (cashRegister) => {
          this.cashRegister.set(
            cashRegister,
          );

          this.loading.set(false);

          this.loadMovements();
        },

        error: (error) => {
          if (error?.status === 400) {
            this.loadLatestCashRegister();

            return;
          }

          this.cashRegister.set(null);

          this.loading.set(false);

          this.movements.set([]);

          if (error?.status === 401) {
            this.error.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.error.set(
            'No fue posible consultar la caja.',
          );
        },
      });
  }

  private loadLatestCashRegister(): void {
    this.cashRegisterService
      .getLatest()
      .subscribe({
        next: (cashRegister) => {
          this.cashRegister.set(
            cashRegister,
          );

          this.loading.set(false);

          this.loadMovements();
        },

        error: (error) => {
          this.cashRegister.set(null);

          this.loading.set(false);

          this.movements.set([]);

          if (error?.status === 400) {
            this.error.set(
              'No tienes una caja registrada actualmente.',
            );

            return;
          }

          if (error?.status === 401) {
            this.error.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.error.set(
            'No fue posible consultar la última caja.',
          );
        },
      });
  }

  private syncCashRegisterState(): void {
    this.cashRegisterService
      .getCurrent()
      .subscribe({
        next: (cashRegister) => {
          this.cashRegister.set(
            cashRegister,
          );

          this.error.set('');

          this.loadMovements();
        },

        error: (error) => {
          if (error?.status === 400) {
            this.cashRegisterService
              .getLatest()
              .subscribe({
                next: (cashRegister) => {
                  this.cashRegister.set(
                    cashRegister,
                  );

                  this.loadMovements();
                },

                error: (latestError) => {
                  if (
                    latestError?.status === 401
                  ) {
                    this.error.set(
                      'Tu sesión ha expirado. Inicia sesión nuevamente.',
                    );
                  }
                },
              });

            return;
          }

          if (error?.status === 401) {
            this.error.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );
          }
        },
      });
  }

  loadMovements(): void {
    this.movementsLoading.set(true);

    this.movementsError.set('');

    this.cashRegisterService
      .getMovements()
      .subscribe({
        next: (movements) => {
          this.movements.set(
            movements,
          );

          this.movementsLoading.set(false);
        },

        error: (error) => {
          this.movements.set([]);

          this.movementsLoading.set(false);

          if (error?.status === 401) {
            this.movementsError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.movementsError.set(
            'No fue posible consultar el historial de movimientos.',
          );
        },
      });
  }

  updateOpeningAmount(
    value: number | null,
  ): void {
    this.openingAmount.set(value);

    this.openCashError.set('');
  }

  openCashRegister(): void {
    this.openCashError.set('');

    const amount =
      this.openingAmount();

    if (
      amount === null ||
      Number.isNaN(amount)
    ) {
      this.openCashError.set(
        'Ingresa el dinero inicial de la caja.',
      );

      return;
    }

    if (amount < 0) {
      this.openCashError.set(
        'El dinero inicial no puede ser negativo.',
      );

      return;
    }

    if (this.openingCash()) {
      return;
    }

    this.openingCash.set(true);

    this.cashRegisterService
      .open({
        openingAmount: amount,
      })
      .subscribe({
        next: (cashRegister) => {
          this.cashRegister.set(
            cashRegister,
          );

          this.openingAmount.set(null);

          this.openCashError.set('');

          this.openingCash.set(false);

          this.error.set('');

          this.syncCashRegisterState();
        },

        error: (error) => {
          this.openingCash.set(false);

          if (error?.status === 400) {
            this.openCashError.set(
              error?.error?.message ??
                'No fue posible abrir la caja.',
            );

            this.syncCashRegisterState();

            return;
          }

          if (error?.status === 401) {
            this.openCashError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.openCashError.set(
            'No fue posible abrir la caja. Intenta nuevamente.',
          );
        },
      });
  }

  updateCountedCash(
    value: number | null,
  ): void {
    this.countedCash.set(value);

    this.closeCashError.set('');
  }

  closeCashRegister(): void {
    this.closeCashError.set('');

    const amount =
      this.countedCash();

    if (
      amount === null ||
      Number.isNaN(amount)
    ) {
      this.closeCashError.set(
        'Ingresa el efectivo contado de la caja.',
      );

      return;
    }

    if (amount < 0) {
      this.closeCashError.set(
        'El efectivo contado no puede ser negativo.',
      );

      return;
    }

    if (this.closingCash()) {
      return;
    }

    this.closingCash.set(true);

    this.cashRegisterService
      .close({
        countedCash: amount,
      })
      .subscribe({
        next: (cashRegister) => {
          this.cashRegister.set(
            cashRegister,
          );

          this.countedCash.set(null);

          this.closeCashError.set('');

          this.closingCash.set(false);

          this.error.set('');

          this.syncCashRegisterState();
        },

        error: (error) => {
          this.closingCash.set(false);

          if (error?.status === 400) {
            this.closeCashError.set(
              error?.error?.message ??
                'No fue posible cerrar la caja.',
            );

            this.syncCashRegisterState();

            return;
          }

          if (error?.status === 401) {
            this.closeCashError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.closeCashError.set(
            'No fue posible cerrar la caja. Intenta nuevamente.',
          );
        },
      });
  }

  updateCashEntryAmount(
    value: number | null,
  ): void {
    this.cashEntryAmount.set(value);

    this.cashEntryError.set('');

    this.cashEntrySuccess.set('');
  }

  updateCashEntryDescription(
    value: string,
  ): void {
    this.cashEntryDescription.set(value);

    this.cashEntryError.set('');

    this.cashEntrySuccess.set('');
  }

  createCashEntry(): void {
    this.cashEntryError.set('');

    this.cashEntrySuccess.set('');

    const amount =
      this.cashEntryAmount();

    const description =
      this.cashEntryDescription().trim();

    if (
      amount === null ||
      Number.isNaN(amount)
    ) {
      this.cashEntryError.set(
        'Ingresa el monto de la entrada de caja.',
      );

      return;
    }

    if (amount <= 0) {
      this.cashEntryError.set(
        'El monto de la entrada debe ser mayor que cero.',
      );

      return;
    }

    if (!description) {
      this.cashEntryError.set(
        'Ingresa el motivo de la entrada de caja.',
      );

      return;
    }

    if (this.cashEntryLoading()) {
      return;
    }

    this.cashEntryLoading.set(true);

    this.cashRegisterService
      .createCashEntry({
        amount,
        description,
      })
      .subscribe({
        next: (cashRegister) => {
          this.cashRegister.set(
            cashRegister,
          );

          this.cashEntryAmount.set(null);

          this.cashEntryDescription.set('');

          this.cashEntryLoading.set(false);

          this.cashEntryError.set('');

          this.cashEntrySuccess.set(
            'Entrada de caja registrada correctamente.',
          );

          this.error.set('');

          this.syncCashRegisterState();
        },

        error: (error) => {
          this.cashEntryLoading.set(false);

          if (error?.status === 400) {
            this.cashEntryError.set(
              error?.error?.message ??
                'No fue posible registrar la entrada de caja.',
            );

            this.syncCashRegisterState();

            return;
          }

          if (error?.status === 401) {
            this.cashEntryError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.cashEntryError.set(
            'No fue posible registrar la entrada de caja. Intenta nuevamente.',
          );
        },
      });
  }

  updateCashExitAmount(
    value: number | null,
  ): void {
    this.cashExitAmount.set(value);

    this.cashExitError.set('');

    this.cashExitSuccess.set('');
  }

  updateCashExitDescription(
    value: string,
  ): void {
    this.cashExitDescription.set(value);

    this.cashExitError.set('');

    this.cashExitSuccess.set('');
  }

  createCashExit(): void {
    this.cashExitError.set('');

    this.cashExitSuccess.set('');

    const amount =
      this.cashExitAmount();

    const description =
      this.cashExitDescription().trim();

    if (
      amount === null ||
      Number.isNaN(amount)
    ) {
      this.cashExitError.set(
        'Ingresa el monto de la salida de caja.',
      );

      return;
    }

    if (amount <= 0) {
      this.cashExitError.set(
        'El monto de la salida debe ser mayor que cero.',
      );

      return;
    }

    if (!description) {
      this.cashExitError.set(
        'Ingresa el motivo de la salida de caja.',
      );

      return;
    }

    const currentCash =
      this.cashRegister()?.expectedCash ?? 0;

    if (amount > currentCash) {
      this.cashExitError.set(
        'La salida no puede superar el efectivo disponible en la caja.',
      );

      return;
    }

    if (this.cashExitLoading()) {
      return;
    }

    this.cashExitLoading.set(true);

    this.cashRegisterService
      .createCashExit({
        amount,
        description,
      })
      .subscribe({
        next: (cashRegister) => {
          this.cashRegister.set(
            cashRegister,
          );

          this.cashExitAmount.set(null);

          this.cashExitDescription.set('');

          this.cashExitLoading.set(false);

          this.cashExitError.set('');

          this.cashExitSuccess.set(
            'Salida de caja registrada correctamente.',
          );

          this.error.set('');

          this.syncCashRegisterState();
        },

        error: (error) => {
          this.cashExitLoading.set(false);

          if (error?.status === 400) {
            this.cashExitError.set(
              error?.error?.message ??
                'No fue posible registrar la salida de caja.',
            );

            this.syncCashRegisterState();

            return;
          }

          if (error?.status === 401) {
            this.cashExitError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          this.cashExitError.set(
            'No fue posible registrar la salida de caja. Intenta nuevamente.',
          );
        },
      });
  }
}