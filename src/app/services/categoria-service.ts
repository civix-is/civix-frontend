import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Categoria } from '../model/categoria';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private url = environment.apiUrl;
  private httpClient = inject(HttpClient);

  registrar(categoria: Partial<Categoria>): Observable<Categoria> {
    return this.httpClient.post<Categoria>(`${this.url}/categoria/registrar`, categoria);
  }

  listar(): Observable<Categoria[]> {
    return this.httpClient.get<Categoria[]>(`${this.url}/categoria/listar`);
  }

  buscarPorId(id: number): Observable<Categoria> {
    const params = new HttpParams().set('id_categoria', id);
    return this.httpClient.get<Categoria>(`${this.url}/categoria/buscar-por-id`, { params });
  }

  actualizar(categoria: Partial<Categoria>): Observable<Categoria> {
    return this.httpClient.put<Categoria>(`${this.url}/categoria/actualizar`, categoria);
  }
}
