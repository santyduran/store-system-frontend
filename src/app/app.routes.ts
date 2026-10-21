
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then((m) => m.Login),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password')
        .then((m) => m.ForgotPassword),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password')
        .then((m) => m.ResetPassword),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then((m) => m.Dashboard),
  },
  {
    path: 'categories',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/categories/categories')
        .then((m) => m.Categories),
  },
  {
    path: 'products',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/products/products')
        .then((m) => m.Products),
  },
  {
    path: 'providers',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/providers/providers')
        .then((m) => m.Providers),
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inventory/inventory')
        .then((m) => m.Inventory),
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sales/sales')
        .then((m) => m.Sales),
  },
  {
    path: 'cash-register',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cash-register/cash-register')
        .then((m) => m.CashRegisterComponent),
  },
  {
    path: 'reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reports/reports')
        .then((m) => m.Reports),
  },
  {
    path: 'invoicing',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/invoicing/invoicing')
        .then((m) => m.Invoicing),
  },
  {
    path: 'supplier-payables',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/supplier-payables/supplier-payables')
        .then((m) => m.SupplierPayables),
  },
  {
    path: 'credit-debit-notes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/credit-debit-notes/credit-debit-notes')
        .then((m) => m.CreditDebitNotes),
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/users/users')
        .then((m) => m.UsersComponent),
  },
];
