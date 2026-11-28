import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EvidenciaRegistroDTO {
  idIncidencia: number;
  urlArchivo: string;
  tipoArchivo?: string;
  fase?: string;
}

@Injectable({ providedIn: 'root' })
export class EvidenciaService {
  private url = environment.apiUrl;
  private httpClient = inject(HttpClient);

  registrar(evidencia: EvidenciaRegistroDTO): Observable<any> {
    return this.httpClient.post(`${this.url}/evidencia/registrar`, evidencia);
  }

  subirArchivo(archivo: File, idIncidencia: number, fase = 'Inicial'): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('id_incidencia', String(idIncidencia));
    formData.append('fase', fase);
    return this.httpClient.post(`${this.url}/evidencia/subir`, formData);
  }

  listar(): Observable<any[]> {
    return this.httpClient.get<any[]>(`${this.url}/evidencia/listar`);
  }

  buscarPorIncidencia(idIncidencia: number): Observable<any[]> {
    const params = new HttpParams().set('id_incidencia', idIncidencia);
    return this.httpClient.get<any[]>(`${this.url}/evidencia/buscar-por-incidencia`, { params });
  }

  eliminar(id: number): Observable<any> {
    const params = new HttpParams().set('id_evidencia', id);
    return this.httpClient.delete(`${this.url}/evidencia/eliminar`, { params });
  }
}
