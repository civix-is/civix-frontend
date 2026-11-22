import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HistorialIncidenciaService {
  private url = environment.apiUrl;
  private httpClient = inject(HttpClient);

  registrar(historial: any): Observable<any> {
    return this.httpClient.post(`${this.url}/historial-incidencia/registrar`, historial);
  }

  listar(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/historial-incidencia/listar`);
  }

  buscarPorIncidencia(idIncidencia: number): Observable<any[]> {
    const params = new HttpParams().set('id_incidencia', idIncidencia);
    return this.httpClient.get<any[]>(`${this.url}/historial-incidencia/buscar-por-incidencia`, {
      params,
    });
  }
}
