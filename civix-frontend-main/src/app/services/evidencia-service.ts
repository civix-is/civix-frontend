import { inject, Service } from '@angular/core';
import {environment} from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import {Observable} from 'rxjs';

@Service()
export class EvidenciaService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  constructor() {}
  registrar(evidencia:EvidenciaService){
    return this.httpClient.post(environment.apiUrl+'/evidencia/registrar', evidencia);
  }
  listar():Observable<EvidenciaService[]>{
    return this.httpClient.get<EvidenciaService[]>(environment.apiUrl+'/evidencia/listar');
  }
  buscarPorIncidencia(idIncidencia:number):Observable<EvidenciaService[]>{
    const params= new HttpParams().set('idIncidencia',idIncidencia);
    return this.httpClient.get<EvidenciaService[]>(environment.apiUrl+'/evidencia/buscar-por-incidencia');
  }
  eliminar(id:number){
    const params= new HttpParams().set('id',id);
    return this.httpClient.delete(environment.apiUrl+'/evidencia/eliminar/',{params});
  }
}
