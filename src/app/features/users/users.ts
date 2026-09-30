import {
  Component,
  OnInit,
  signal,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  CreateUser,
  UpdateUser,
  User,
  UserStatus,
  UsersService,
} from '../../core/services/users.service';

@Component({
  selector: 'app-users',
  imports: [
    FormsModule,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class UsersComponent
  implements OnInit
{
  users =
    signal<User[]>([]);

  loading =
    signal(false);

  error =
    signal('');

  showCreateForm =
    signal(false);

  name =
    signal('');

  email =
    signal('');

  password =
    signal('');

  role =
    signal<'ADMIN' | 'CASHIER'>('CASHIER');

  creating =
    signal(false);

  createError =
    signal('');

  editingUser =
    signal<User | null>(null);

  editName =
    signal('');

  editEmail =
    signal('');

  editRole =
    signal<'ADMIN' | 'CASHIER'>('CASHIER');

  editPassword =
    signal('');

  updating =
    signal(false);

  updatingPassword =
    signal(false);

  updateError =
    signal('');

  passwordError =
    signal('');

  updatingStatus =
    signal<string | null>(null);

  statusError =
    signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  loadUsers(): void {
    this.loading.set(true);

    this.error.set('');

    this.usersService
      .findAll()
      .subscribe({
        next: (users) => {
          this.users.set(users);

          this.loading.set(false);
        },

        error: (error) => {
          this.users.set([]);

          this.loading.set(false);

          if (error?.status === 401) {
            this.error.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 403) {
            this.error.set(
              'No tienes permisos para consultar los usuarios.',
            );

            return;
          }

          this.error.set(
            'No fue posible consultar los usuarios.',
          );
        },
      });
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);

    this.createError.set('');
  }

  closeCreateForm(): void {
    this.showCreateForm.set(false);

    this.name.set('');
    this.email.set('');
    this.password.set('');
    this.role.set('CASHIER');

    this.createError.set('');
    this.creating.set(false);
  }

  createUser(): void {
    this.createError.set('');

    const user: CreateUser = {
      name: this.name().trim(),
      email: this.email().trim(),
      password: this.password(),
      role: this.role(),
    };

    if (!user.name) {
      this.createError.set(
        'Ingresa el nombre del usuario.',
      );

      return;
    }

    if (!user.email) {
      this.createError.set(
        'Ingresa el correo electrónico.',
      );

      return;
    }

    if (!user.password) {
      this.createError.set(
        'Ingresa una contraseña.',
      );

      return;
    }

    if (user.password.length < 6) {
      this.createError.set(
        'La contraseña debe tener mínimo 6 caracteres.',
      );

      return;
    }

    if (this.creating()) {
      return;
    }

    this.creating.set(true);

    this.usersService
      .create(user)
      .subscribe({
        next: (createdUser) => {
          this.users.update(
            (users) => [
              createdUser,
              ...users,
            ],
          );

          this.name.set('');
          this.email.set('');
          this.password.set('');
          this.role.set('CASHIER');

          this.createError.set('');

          this.creating.set(false);

          this.showCreateForm.set(false);
        },

        error: (error) => {
          this.creating.set(false);

          if (error?.status === 400) {
            this.createError.set(
              error?.error?.message ??
                'Los datos del usuario no son válidos.',
            );

            return;
          }

          if (error?.status === 401) {
            this.createError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 403) {
            this.createError.set(
              'No tienes permisos para crear usuarios.',
            );

            return;
          }

          this.createError.set(
            'No fue posible crear el usuario. Intenta nuevamente.',
          );
        },
      });
  }

  startEdit(
    user: User,
  ): void {
    this.editingUser.set(user);

    this.editName.set(user.name);

    this.editEmail.set(user.email);

    this.editRole.set(user.role);

    this.editPassword.set('');

    this.updateError.set('');

    this.passwordError.set('');

    this.showCreateForm.set(false);
  }

  cancelEdit(): void {
    this.editingUser.set(null);

    this.editName.set('');

    this.editEmail.set('');

    this.editRole.set('CASHIER');

    this.editPassword.set('');

    this.updateError.set('');

    this.passwordError.set('');

    this.updating.set(false);

    this.updatingPassword.set(false);
  }

  updateUser(): void {
    this.updateError.set('');

    const user =
      this.editingUser();

    if (!user) {
      return;
    }

    const updateData: UpdateUser = {
      name: this.editName().trim(),
      email: this.editEmail().trim(),
      role: this.editRole(),
    };

    if (!updateData.name) {
      this.updateError.set(
        'Ingresa el nombre del usuario.',
      );

      return;
    }

    if (!updateData.email) {
      this.updateError.set(
        'Ingresa el correo electrónico.',
      );

      return;
    }

    if (this.updating()) {
      return;
    }

    this.updating.set(true);

    this.usersService
      .update(
        user._id,
        updateData,
      )
      .subscribe({
        next: (updatedUser) => {
          this.users.update(
            (users) =>
              users.map(
                (currentUser) =>
                  currentUser._id ===
                  updatedUser._id
                    ? updatedUser
                    : currentUser,
              ),
          );

          this.cancelEdit();
        },

        error: (error) => {
          this.updating.set(false);

          if (error?.status === 400) {
            this.updateError.set(
              error?.error?.message ??
                'Los datos del usuario no son válidos.',
            );

            return;
          }

          if (error?.status === 401) {
            this.updateError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 403) {
            this.updateError.set(
              'No tienes permisos para editar usuarios.',
            );

            return;
          }

          if (error?.status === 404) {
            this.updateError.set(
              'El usuario no fue encontrado.',
            );

            return;
          }

          this.updateError.set(
            'No fue posible actualizar el usuario. Intenta nuevamente.',
          );
        },
      });
  }

  changeUserPassword(): void {
    this.passwordError.set('');

    const user =
      this.editingUser();

    if (!user) {
      return;
    }

    const newPassword =
      this.editPassword();

    if (!newPassword) {
      this.passwordError.set(
        'Ingresa una nueva contraseña.',
      );

      return;
    }

    if (newPassword.length < 6) {
      this.passwordError.set(
        'La contraseña debe tener mínimo 6 caracteres.',
      );

      return;
    }

    if (this.updatingPassword()) {
      return;
    }

    this.updatingPassword.set(true);

    this.usersService
      .updatePassword(
        user._id,
        newPassword,
      )
      .subscribe({
        next: () => {
          this.editPassword.set('');

          this.passwordError.set('');

          this.updatingPassword.set(false);
        },

        error: (error) => {
          this.updatingPassword.set(false);

          if (error?.status === 400) {
            this.passwordError.set(
              error?.error?.message ??
                'La nueva contraseña no es válida.',
            );

            return;
          }

          if (error?.status === 401) {
            this.passwordError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 403) {
            this.passwordError.set(
              'No tienes permisos para cambiar la contraseña.',
            );

            return;
          }

          if (error?.status === 404) {
            this.passwordError.set(
              'El usuario no fue encontrado.',
            );

            return;
          }

          this.passwordError.set(
            'No fue posible cambiar la contraseña. Intenta nuevamente.',
          );
        },
      });
  }

  updateUserStatus(
    user: User,
  ): void {
    if (this.updatingStatus()) {
      return;
    }

    this.statusError.set('');

    const newStatus: UserStatus =
      user.status === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';

    this.updatingStatus.set(
      user._id,
    );

    this.usersService
      .updateStatus(
        user._id,
        newStatus,
      )
      .subscribe({
        next: (updatedUser) => {
          this.users.update(
            (users) =>
              users.map(
                (currentUser) =>
                  currentUser._id ===
                  updatedUser._id
                    ? updatedUser
                    : currentUser,
              ),
          );

          this.updatingStatus.set(null);
        },

        error: (error) => {
          this.updatingStatus.set(null);

          if (error?.status === 400) {
            this.statusError.set(
              error?.error?.message ??
                'El estado del usuario no es válido.',
            );

            return;
          }

          if (error?.status === 401) {
            this.statusError.set(
              'Tu sesión ha expirado. Inicia sesión nuevamente.',
            );

            return;
          }

          if (error?.status === 403) {
            this.statusError.set(
              'No tienes permisos para cambiar el estado del usuario.',
            );

            return;
          }

          if (error?.status === 404) {
            this.statusError.set(
              'El usuario no fue encontrado.',
            );

            return;
          }

          this.statusError.set(
            'No fue posible cambiar el estado del usuario. Intenta nuevamente.',
          );
        },
      });
  }

  updateName(
    value: string,
  ): void {
    this.name.set(value);

    this.createError.set('');
  }

  updateEmail(
    value: string,
  ): void {
    this.email.set(value);

    this.createError.set('');
  }

  updatePasswordField(
    value: string,
  ): void {
    this.password.set(value);

    this.createError.set('');
  }

  updateRole(
    value: 'ADMIN' | 'CASHIER',
  ): void {
    this.role.set(value);

    this.createError.set('');
  }

  updateEditName(
    value: string,
  ): void {
    this.editName.set(value);

    this.updateError.set('');
  }

  updateEditEmail(
    value: string,
  ): void {
    this.editEmail.set(value);

    this.updateError.set('');
  }

  updateEditRole(
    value: 'ADMIN' | 'CASHIER',
  ): void {
    this.editRole.set(value);

    this.updateError.set('');
  }

  updateEditPassword(
    value: string,
  ): void {
    this.editPassword.set(value);

    this.passwordError.set('');
  }
}