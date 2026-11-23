import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Calificacion, CalificacionRegistro } from '../model/calificación';

@Service()
export class CalificacionService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  constructor() {}
  registrar(calificacion: CalificacionRegistro){
    return this.httpClient.post<Calificacion>(environment.apiUrl+'/calificacion/registrar', calificacion);
  }
  listar():Observable<Calificacion[]> {
    return this.httpClient.get<Calificacion[]>(environment.apiUrl+'/calificacion/listar');
  }
  buscarPorId(id:number){
    const params= new HttpParams().set('id', id);
    return this.httpClient.get<Calificacion>(environment.apiUrl+'/calificacion/buscar-por-id',{params});
  }
  buscarPorIncidencia(id_incidencia:number){
    const params= new HttpParams().set('id_incidencia', id_incidencia);
    return this.httpClient.get<Calificacion>(environment.apiUrl+'/calificacion/buscar-por-incidencia',{params});
  }
}
