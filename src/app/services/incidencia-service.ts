import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { IncidenciaRegistro } from '../model/incidencia-registro';
import { Incidencia } from '../model/incidencia';
import { Observable } from 'rxjs';
import { IncidenciaActualizar } from '../model/incidencia-actualizar';

@Service()
export class IncidenciaService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  constructor() {}
  registrar(incidencia: IncidenciaRegistro) {
    return this.httpClient.post<Incidencia>(environment.apiUrl + '/incidencia/registrar', incidencia);
  }
  listarMisIncidencias(): Observable<Incidencia[]> {
    return this.httpClient.get<Incidencia[]>(environment.apiUrl + '/incidencia/mis-reportes');
  }
  listar(): Observable<Incidencia[]>{
   return this.httpClient.get<Incidencia[]>(environment.apiUrl + '/incidencia/listar');
  }
  buscarporId(id: number) {
    return this.httpClient.get<Incidencia>(environment.apiUrl + '/incidencia/buscar-por-id/{id}');
  }
  buscarPorEstadoAtencion(estadoAtencion: string): Observable<Incidencia[]>{
    return this.httpClient.get<Incidencia[]>(environment.apiUrl+'/incidencia/estado/{estadoAtencion}');
  }
  actualizar(incidencia:IncidenciaActualizar){
    return this.httpClient.put<Incidencia>(environment.apiUrl + '/incidencia/actualizar', incidencia);
  }
  eliminar(id:number){
    return this.httpClient.request('delete',environment.apiUrl + '/incidencia/eliminar',{body: id});
  }
}
