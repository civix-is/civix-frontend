import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Usuario } from '../model/usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);

  idUsuario = signal<number | null>(null);
  nombreUsuario = signal<string>('');
  inicialesUsuario = signal<string>('US');
  usuarioActual = signal<Usuario | null>(null);

  login(credenciales: { correo: string; password: string; recordarme?: boolean }): Observable<any> {
    return this.httpClient
      .post(this.url + '/auth/login', credenciales, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<any>) => {
          const token = response.body?.jwt || response.headers.get('Authorization');
          if (token) {
            const limpiarToken = token.startsWith('Bearer ') ? token.substring(7) : token;

            if (credenciales.recordarme) {
              localStorage.setItem('token', limpiarToken);
            } else {
              sessionStorage.setItem('token', limpiarToken);
            }
            this.cargarDatosUsuario();
          }
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    this.idUsuario.set(null);
    this.nombreUsuario.set('');
    this.inicialesUsuario.set('US');
    this.usuarioActual.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  estaLogueado(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = JSON.parse(atob(payloadBase64));
      const expiracion = payloadJson.exp * 1000;
      const tokenExpirado = expiracion < Date.now();

      if (tokenExpirado) {
        this.logout();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  getCorreo(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  getRol(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const roles: string[] = payload.roles || [];

      const rol =
        roles.find((r) => r.replace(/^ROLE_/, '') === 'ADMINISTRADOR') ||
        roles[0] ||
        payload.rol ||
        payload.authorities?.[0]?.authority;

      return typeof rol === 'string' ? rol.replace(/^ROLE_/, '') : null;
    } catch {
      return null;
    }
  }

  cargarDatosUsuario(): void {
    const correo = this.getCorreo();
    if (!correo) return;

    const params = new HttpParams().set('correo', correo);
    this.httpClient.get<Usuario>(`${this.url}/usuario/buscar-por-correo`, { params }).subscribe({
      next: (usuario) => {
        this.usuarioActual.set(usuario);
        this.idUsuario.set(usuario.idUsuario ?? null);
        const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
        this.nombreUsuario.set(nombreCompleto || correo);

        const iniNombre = usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '';
        const iniApellido = usuario.apellido ? usuario.apellido.charAt(0).toUpperCase() : '';
        this.inicialesUsuario.set(iniNombre + iniApellido || correo.substring(0, 2).toUpperCase());
      },
      error: () => {
        this.nombreUsuario.set(correo);
        this.inicialesUsuario.set(correo.substring(0, 2).toUpperCase());
      },
    });
  }
}
