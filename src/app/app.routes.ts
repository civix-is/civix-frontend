import { Routes } from '@angular/router';
import { AcercaComponent } from './componente/acerca-component/acerca-component';
import { Registro } from './componente/registro/registro';
import { UsuarioLista } from './componente/usuario-lista/usuario-lista';
import { Login } from './componente/login/login';
import { IncidenciaCrear } from './componente/incidencia-crear/incidencia-crear';
import { IncidenciaLista } from './componente/incidencia-lista/incidencia-lista';

// Importar los Guards
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  // Redirección base
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rutas Públicas (Protegidas por publicGuard)
  { path: 'login', component: Login, canActivate: [publicGuard] },
  { path: 'usuarios-registro', component: Registro, canActivate: [publicGuard] },
  { path: 'acerca', component: AcercaComponent, canActivate: [publicGuard] },

  // Rutas Privadas (Protegidas por authGuard)
  { path: 'incidencia-crear', component: IncidenciaCrear, canActivate: [authGuard] },
  { path: 'mis-incidencias', component: IncidenciaLista, canActivate: [authGuard] },
  { path: 'usuarios-lista', component: UsuarioLista, canActivate: [authGuard] },
];
