import { Routes } from '@angular/router';
import { HomeComponent } from './componente/home-component/home-component';
import { Registro } from './componente/registro/registro';
import { UsuarioLista } from './componente/usuario-lista/usuario-lista';
import { Login } from './componente/login/login';
import { IncidenciaCrear } from './componente/incidencia-crear/incidencia-crear';
import { IncidenciaLista } from './componente/incidencia-lista/incidencia-lista';
import { IncidenciaDetalle } from './componente/incidencia-detalle/incidencia-detalle';
import { MapaComponent } from './componente/mapa/mapa';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  { path: 'home', component: HomeComponent, canActivate: [publicGuard] },
  { path: 'login', component: Login, canActivate: [publicGuard] },
  { path: 'usuarios-registro', component: Registro, canActivate: [publicGuard] },

  { path: 'incidencia-crear', component: IncidenciaCrear, canActivate: [authGuard] },
  { path: 'mis-incidencias', component: IncidenciaLista, canActivate: [authGuard] },
  { path: 'mapa', component: MapaComponent, canActivate: [authGuard] },
  { path: 'incidencia-detalle/:id', component: IncidenciaDetalle, canActivate: [authGuard] },
  { path: 'usuarios-lista', component: UsuarioLista, canActivate: [authGuard] },


  { path: '**', redirectTo: '/home' },
];
