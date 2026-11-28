import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  {
    path: 'home',
    loadComponent: () =>
      import('./componente/home-component/home-component').then((m) => m.HomeComponent),
    canActivate: [publicGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./componente/login/login').then((m) => m.Login),
    canActivate: [publicGuard],
  },
  {
    path: 'usuarios-registro',
    loadComponent: () => import('./componente/registro/registro').then((m) => m.Registro),
    canActivate: [publicGuard],
  },


  {
    path: 'incidencia-crear',
    loadComponent: () =>
      import('./componente/incidencia-crear/incidencia-crear').then((m) => m.IncidenciaCrear),
    canActivate: [authGuard],
  },
  {
    path: 'mis-incidencias',
    loadComponent: () =>
      import('./componente/incidencia-lista/incidencia-lista').then((m) => m.IncidenciaLista),
    canActivate: [authGuard],
  },
  {
    path: 'mapa',
    loadComponent: () => import('./componente/mapa/mapa').then((m) => m.MapaComponent),
    canActivate: [authGuard],
  },
  {
    path: 'incidencia-detalle/:id',
    loadComponent: () =>
      import('./componente/incidencia-detalle/incidencia-detalle').then((m) => m.IncidenciaDetalle),
    canActivate: [authGuard],
  },
  {
    path: 'usuarios-lista',
    loadComponent: () =>
      import('./componente/usuario-lista/usuario-lista').then((m) => m.UsuarioLista),
    canActivate: [authGuard],
  },
  {
    path: 'categorias',
    loadComponent: () =>
      import('./componente/categoria-lista/categoria-lista').then((m) => m.CategoriaLista),
    canActivate: [authGuard],
  },
  {
    path: 'evidencias',
    loadComponent: () =>
      import('./componente/evidencia-subida/evidencia-subida').then((m) => m.EvidenciaSubida),
    canActivate: [authGuard],
  },
  {
    path: 'calificaciones',
    loadComponent: () =>
      import('./componente/calificacion-form/calificacion-form').then((m) => m.CalificacionForm),
    canActivate: [authGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./componente/perfil/perfil').then((m) => m.PerfilComponent),
    canActivate: [authGuard],
  },
  {
    path: 'incidencia-todas',
    loadComponent: () =>
      import('./componente/incidencias-todas/incidencias-todas').then((m) => m.IncidenciasTodas),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: '/home' },
];
