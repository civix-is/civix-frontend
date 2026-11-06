import { inject, Service } from '@angular/core';
import {environment} from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { UsuarioRegistro } from '../model/usuario-registro';
import {Observable} from 'rxjs';
import {Usuario} from '../model/usuario';

@Service()
export class UsuarioService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  constructor() {}
  registrar(usuario: UsuarioRegistro) {
    return this.httpClient.post(environment.apiUrl + '/usuario/registrar', usuario);
  }
  list(): Observable<Usuario[]> {
    return this.httpClient.get<Usuario[]>(environment.apiUrl + '/usuario/listar');
  }
  buscarporId(id: number) {
    const params = new HttpParams().set('id', id);
    return this.httpClient.get(environment.apiUrl + '/usuario/buscar-por-id', { params });
  }
  buscarporCorreo(correo: string) {
    const params = new HttpParams().set('correo', correo);
    return this.httpClient.get(environment.apiUrl + '/usuario/buscar-por-correo', { params });
  }
  eliminar(id: number) {
    const params = new HttpParams().set('id', id);
    return this.httpClient.delete(environment.apiUrl + '/usuario/eliminar', {params});
  }
}
