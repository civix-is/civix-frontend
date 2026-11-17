import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Service()
export class HistorialIncidenciaService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  constructor() {}
  registrar(historial:HistorialIncidenciaService){
    return this.httpClient.post<HistorialIncidenciaService>(environment.apiUrl + '/historia-incidencia/registrar',historial);
  }
  listar():Observable<HistorialIncidenciaService[]>{
    return this.httpClient.get<HistorialIncidenciaService[]>(environment.apiUrl + '/historia-incidencia/listar');
  }
  buscarPorIncidencia(idIncidencia:number): Observable<HistorialIncidenciaService[]>{
    const params= new HttpParams().set('id_incidencia', idIncidencia);
    return this.httpClient.get<HistorialIncidenciaService[]>(environment.apiUrl + '/historia-incidencia/buscar-por-incidencia', { params });
  }
  buscarPorIncidenciaReciente(incidenciaId:number): Observable<HistorialIncidenciaService[]>{
    const params= new HttpParams().set('incidenciaId', incidenciaId);
    return this.httpClient.get<HistorialIncidenciaService[]>(environment.apiUrl + '/historia-incidencia/buscar-por-incidencia-recientes', { params });
  }
  buscarPorUsuario(idUsuario:number): Observable<HistorialIncidenciaService[]>{
    const params = new HttpParams().set('id_usuario', idUsuario);
    return this.httpClient.get<HistorialIncidenciaService[]>(environment.apiUrl + '/historia-incidencia/buscar-por-usuario', { params });
  }
}
