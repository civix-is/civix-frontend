import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Calificacion, CalificacionRegistro } from '../model/calificación';

export interface Calificacion {
  idCalificacion?: number;
  puntuacion: number;
  comentario?: string;
  fechaCalificacion?: string;
  idIncidencia: number;
}

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  private url = environment.apiUrl;
  private httpClient = inject(HttpClient);

  registrar(calificacion: Calificacion): Observable<Calificacion> {
    return this.httpClient.post<Calificacion>(`${this.url}/calificacion/registrar`, calificacion);
  }

  listar(): Observable<Calificacion[]> {
    return this.httpClient.get<Calificacion[]>(`${this.url}/calificacion/listar`);
  }

  buscarPorId(id: number): Observable<Calificacion> {
    const params = new HttpParams().set('id_calificacion', id);
    return this.httpClient.get<Calificacion>(`${this.url}/calificacion/buscar-por-id`, { params });
  }

  buscarPorIncidencia(idIncidencia: number): Observable<Calificacion> {
    const params = new HttpParams().set('id_incidencia', idIncidencia);
    return this.httpClient.get<Calificacion>(`${this.url}/calificacion/buscar-por-incidencia`, {
      params,
    });
  }
}
