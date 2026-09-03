import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [roleGuard]
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/productos/productos.component').then(m => m.ProductosComponent),
        canActivate: [roleGuard]
      },
      {
        path: 'proveedores',
        loadComponent: () => import('./pages/proveedores/proveedores.component').then(m => m.ProveedoresComponent),
        canActivate: [roleGuard]
      },
      {
        path: 'inventario',
        loadComponent: () => import('./pages/inventario/inventario.component').then(m => m.InventarioComponent),
        canActivate: [roleGuard]
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
        canActivate: [roleGuard]
      },
      {
        path: 'logs',
        loadComponent: () => import('./pages/logs/logs.component').then(m => m.LogsComponent),
        canActivate: [roleGuard]
      },
      {
        path: 'reportes/precios',
        loadComponent: () => import('./pages/reportes/reportes-precios.component').then(m => m.ReportesPreciosComponent),
        canActivate: [roleGuard]
      }
    ]
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
