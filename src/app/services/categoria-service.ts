import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria } from '../model/categoria';

@Service()
export class CategoriaService {
  private url = environment.apiUrl;
  private httpClient: HttpClient = inject(HttpClient);
  constructor() {}
  registrar(categoria:CategoriaService){
    return this.httpClient.post<CategoriaService>(environment.apiUrl+"/categoria/registrar",categoria);
  }
  listar(): Observable<Categoria[]> {
    return this.httpClient.get<Categoria[]>(environment.apiUrl + "/categoria/listar");
  }
  buscarPorId(id:number):Observable<CategoriaService[]>{
    const params = new HttpParams().set('id', id);
    return this.httpClient.get<CategoriaService[]>(environment.apiUrl+'/categoria/buscar-por-id',{params});
  }
  actualizar(categoria:CategoriaService){
    return this.httpClient.put<CategoriaService>(environment.apiUrl+"/categoria/actualizar",categoria);
  }
}
