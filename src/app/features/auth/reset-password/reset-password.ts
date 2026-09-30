import {
  ChangeDetectorRef,
  Component,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  PasswordRecoveryService,
} from '../../../core/services/password-recovery.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  token = '';

  password = '';
  confirmPassword = '';

  message = '';
  errorMessage = '';
  loading = false;

  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly router:
      Router,

    private readonly passwordRecoveryService:
      PasswordRecoveryService,

    private readonly changeDetectorRef:
      ChangeDetectorRef,
  ) {
    this.token =
      this.route.snapshot.queryParamMap.get(
        'token',
      ) ?? '';
  }

  resetPassword(): void {
    this.message = '';
    this.errorMessage = '';

    if (this.loading) {
      return;
    }

    if (!this.token) {
      this.errorMessage =
        'El enlace de recuperación no contiene un token válido.';

      return;
    }

    if (!this.password) {
      this.errorMessage =
        'Ingresa una nueva contraseña.';

      return;
    }

    if (this.password.length < 6) {
      this.errorMessage =
        'La contraseña debe tener al menos 6 caracteres.';

      return;
    }

    if (
      this.password !==
      this.confirmPassword
    ) {
      this.errorMessage =
        'Las contraseñas no coinciden.';

      return;
    }

    this.loading = true;

    this.changeDetectorRef.detectChanges();

    this.passwordRecoveryService
      .resetPassword(
        this.token,
        this.password,
      )
      .subscribe({
        next: (response) => {
          this.message =
            response.message;

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },

        error: (error) => {
          console.error(
            'Error al restablecer contraseña:',
            error,
          );

          if (
            error?.status === 401
          ) {
            this.errorMessage =
              'El enlace de recuperación no es válido o ha expirado.';
          } else {
            this.errorMessage =
              'No fue posible restablecer la contraseña. Intenta nuevamente.';
          }

          this.loading = false;

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  goToLogin(): void {
    this.router.navigate([
      '/login',
    ]);
  }
}