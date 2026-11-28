import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IncidenciaRegistro } from '../model/incidencia-registro';
import { Incidencia } from '../model/incidencia';
import { Observable, tap } from 'rxjs';
import { IncidenciaRealtimeService } from './incidencia-realtime.service';

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private url = environment.apiUrl;
  private httpClient = inject(HttpClient);
  private realtime = inject(IncidenciaRealtimeService);

  registrar(incidencia: IncidenciaRegistro): Observable<Incidencia> {
    return this.httpClient
      .post<Incidencia>(`${this.url}/incidencia/registrar`, incidencia)
      .pipe(tap((nueva) => this.realtime.aplicarCreacionLocal(nueva)));
  }

  listarMisIncidencias(): Observable<Incidencia[]> {
    return this.httpClient.get<Incidencia[]>(`${this.url}/incidencia/mis-reportes`);
  }

  listar(): Observable<Incidencia[]> {
    return this.httpClient.get<Incidencia[]>(`${this.url}/incidencia/listar`);
  }

  buscarporId(id: number): Observable<Incidencia> {
    const params = new HttpParams().set('id_incidencia', id);
    return this.httpClient.get<Incidencia>(`${this.url}/incidencia/buscar-por-id`, { params });
  }

  buscarPorEstadoAtencion(estadoAtencion: string): Observable<Incidencia[]> {
    const params = new HttpParams().set('estado_atencion', estadoAtencion);
    return this.httpClient.get<Incidencia[]>(`${this.url}/incidencia/buscar-por-estado-atencion`, {
      params,
    });
  }

  actualizar(incidencia: any): Observable<Incidencia> {
    return this.httpClient
      .put<Incidencia>(`${this.url}/incidencia/actualizar`, incidencia)
      .pipe(tap((actualizada) => this.realtime.aplicarActualizacionLocal(actualizada)));
  }

  eliminar(id: number): Observable<any> {
    const params = new HttpParams().set('id_incidencia', id);
    return this.httpClient
      .delete(`${this.url}/incidencia/eliminar`, { params })
      .pipe(tap(() => this.realtime.aplicarEliminacionLocal(id)));
  }
}
