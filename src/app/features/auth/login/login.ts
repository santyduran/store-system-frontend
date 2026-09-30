import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';

  loginError = '';
  loading = false;

  constructor(
    private readonly authService: Auth,
    private readonly router: Router,
  ) {}

  login(): void {
    this.loginError = '';

    if (this.loading) {
      return;
    }

    this.loading = true;

    this.authService
      .login(this.email, this.password)
      .subscribe({
        next: () => {
          this.loading = false;

          this.router.navigate([
            '/dashboard',
          ]);
        },

        error: (error) => {
          this.loading = false;

          if (error?.status === 401) {
            this.loginError =
              'Correo o contraseña incorrectos.';

            return;
          }

          this.loginError =
            'No fue posible iniciar sesión. Intenta nuevamente.';
        },
      });
  }
}