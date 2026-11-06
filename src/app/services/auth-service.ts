import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);

  // Agregamos el parámetro opcional 'recordarme'
  login(credenciales: { correo: string; password: string; recordarme?: boolean }): Observable<any> {
    return this.httpClient
      .post(this.url + '/auth/login', credenciales, { observe: 'response' })
      .pipe(
        tap((response: HttpResponse<any>) => {
          const token = response.body?.jwt || response.headers.get('Authorization');
          if (token) {
            const limpiarToken = token.startsWith('Bearer ') ? token.substring(7) : token;

            // Si marcó la casilla, persiste en localStorage. Si no, en sessionStorage.
            if (credenciales.recordarme) {
              localStorage.setItem('token', limpiarToken);
            } else {
              sessionStorage.setItem('token', limpiarToken);
            }
          }
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }

  getToken(): string | null {
    // Busca en ambos almacenamientos
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  estaLogueado(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Leemos el payload para verificar si el token ya caducó
      const payloadBase64 = token.split('.')[1];
      const payloadJson = JSON.parse(atob(payloadBase64));

      // 'exp' viene en segundos desde Spring Boot, lo pasamos a milisegundos
      const expiracion = payloadJson.exp * 1000;
      const tokenExpirado = expiracion < Date.now();

      if (tokenExpirado) {
        this.logout(); // Limpiamos rastros si ya caducó
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  getRol(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadJson = JSON.parse(atob(token.split('.')[1]));
      return payloadJson.rol || payloadJson.authorities?.[0]?.authority || 'CIUDADANO';
    } catch (e) {
      return null;
    }
  }
}
