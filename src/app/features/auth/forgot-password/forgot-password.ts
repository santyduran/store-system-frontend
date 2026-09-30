import {
  ChangeDetectorRef,
  Component,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
} from '@angular/router';

import {
  PasswordRecoveryService,
} from '../../../core/services/password-recovery.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  email = '';

  message = signal('');
  errorMessage = signal('');
  loading = signal(false);

  constructor(
    private readonly passwordRecoveryService:
      PasswordRecoveryService,

    private readonly router:
      Router,

    private readonly changeDetectorRef:
      ChangeDetectorRef,
  ) {}

  forgotPassword(): void {
    this.message.set('');
    this.errorMessage.set('');

    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    this.passwordRecoveryService
      .forgotPassword(this.email)
      .subscribe({
        next: (response) => {
          this.message.set(
            response.message,
          );

          this.loading.set(false);

          this.changeDetectorRef.detectChanges();
        },

        error: () => {
          this.errorMessage.set(
            'No fue posible procesar la solicitud. Intenta nuevamente.',
          );

          this.loading.set(false);

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