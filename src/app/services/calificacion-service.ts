import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Service()
export class CalificacionService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  constructor() {}
  registrar(calificacion: CalificacionService){
    return this.httpClient.post<CalificacionService>(environment.apiUrl+'/calificacion/registrar', calificacion);
  }
  listar():Observable<CalificacionService[]> {
    return this.httpClient.get<CalificacionService[]>(environment.apiUrl+'/calificacion/listar');
  }
  buscarPorId(id:number){
    const params= new HttpParams().set('id', id);
    return this.httpClient.get<CalificacionService>(environment.apiUrl+'/calificacion/buscar-por-id',{params});
  }
  buscarPorIncidencia(idIncidencia:number){
    const params= new HttpParams().set('id_Incidencia', idIncidencia);
    return this.httpClient.get<CalificacionService>(environment.apiUrl+'/calificacion/buscar-por-incidencia',{params});
  }
}
