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
              'Tu sesiÃ³n ha expirado. Inicia sesiÃ³n nuevamente.',
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
              'Tu sesiÃ³n ha expirado. Inicia sesiÃ³n nuevamente.',
            );

            return;
          }

          this.error.set(
            'No fue posible consultar la Ãºltima caja.',
          );
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
              'Tu sesiÃ³n ha expirado. Inicia sesiÃ³n nuevamente.',
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

          this.loadMovements();
        },

        error: (error) => {
          this.openingCash.set(false);

          if (error?.status === 400) {
            this.openCashError.set(
              error?.error?.message ??
                'No fue posible abrir la caja.',
            );

            return;
          }

          if (error?.status === 401) {
            this.openCashError.set(
              'Tu sesiÃ³n ha expirado. Inicia sesiÃ³n nuevamente.',
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

          this.loadMovements();
        },

        error: (error) => {
          this.closingCash.set(false);

          if (error?.status === 400) {
            this.closeCashError.set(
              error?.error?.message ??
                'No fue posible cerrar la caja.',
            );

            return;
          }

          if (error?.status === 401) {
            this.closeCashError.set(
              'Tu sesiÃ³n ha expirado. Inicia sesiÃ³n nuevamente.',
            );

            return;
          }

          this.closeCashError.set(
            'No fue posible cerrar la caja. Intenta nuevamente.',
          );
        },
      });
  }
}