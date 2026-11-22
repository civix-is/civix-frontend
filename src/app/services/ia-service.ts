import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Service()
export class IaService {
  private http = inject(HttpClient);

  mejorarDescripcion(body: {
    descripcion: string;
    categoria?: string;
  }): Observable<{ descripcionMejorada: string }> {
    return this.http.post<{ descripcionMejorada: string }>(
      environment.apiUrl + '/ia/mejorar-descripcion',
      body,
    );
  }
}
