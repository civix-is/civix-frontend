import { inject, Service } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Rol } from '../model/rol';
import { Observable } from 'rxjs';

@Service()
export class RolService {
  private url= environment.apiUrl;
  private httpClient: HttpClient=inject(HttpClient);
  constructor(){
  }
  registrar(rol: Rol){
    console.log(rol);
    return this.httpClient.post(environment.apiUrl+'/rol/registrar',rol);
  }
  list(): Observable<Rol[]>{
    return this.httpClient.get<Rol[]>(environment.apiUrl+'/rol/listar');
  }
  eliminar(id:number){
    return this.httpClient.delete(environment.apiUrl+'/rol/eliminar/'+id);
  }
}
