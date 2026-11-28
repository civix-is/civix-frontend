import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Incidencia } from '../model/incidencia';
import { AuthService } from './auth-service';

export interface IncidenciaEventoTiempoReal {
  tipo: 'CREADA' | 'ACTUALIZADA' | 'ELIMINADA';
  incidencia?: Incidencia;
  idIncidencia: number;
}

@Injectable({ providedIn: 'root' })
export class IncidenciaRealtimeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

  readonly incidencias = signal<Incidencia[]>([]);
  readonly misIncidencias = signal<Incidencia[]>([]);
  readonly conectadoTiempoReal = signal(false);
  readonly cargando = signal(false);
  readonly cargandoMias = signal(false);

  private readonly eventosSubject = new Subject<IncidenciaEventoTiempoReal>();
  readonly eventos$ = this.eventosSubject.asObservable();

  private abortController: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private activo = false;
  private conectando = false;
  private intentosReconexion = 0;

  asegurarConexion(): void {
    if (!this.authService.estaLogueado()) {
      this.detener();
      return;
    }

    if (this.activo) {
      return;
    }

    this.activo = true;
    this.cargarTodas();
    void this.conectarStream();
  }

  cargarTodas(): void {
    if (!this.authService.estaLogueado()) return;
    if (this.incidencias().length === 0) {
      this.cargando.set(true);
    }
    this.http.get<Incidencia[]>(`${environment.apiUrl}/incidencia/listar`).subscribe({
      next: (lista) => {
        this.incidencias.set(this.ordenarPorReciente(lista));
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      },
    });
  }

  cargarMisIncidencias(): void {
    if (!this.authService.estaLogueado()) return;
    if (this.misIncidencias().length === 0) {
      this.cargandoMias.set(true);
    }
    this.http.get<Incidencia[]>(`${environment.apiUrl}/incidencia/mis-reportes`).subscribe({
      next: (lista) => {
        this.misIncidencias.set(this.ordenarPorReciente(lista));
        this.cargandoMias.set(false);
      },
      error: () => {
        this.cargandoMias.set(false);
      },
    });
  }

  aplicarCreacionLocal(incidencia: Incidencia): void {
    this.upsertEnLista(this.incidencias, incidencia, true);
    this.upsertEnLista(this.misIncidencias, incidencia, true);
  }

  aplicarActualizacionLocal(incidencia: Incidencia): void {
    this.upsertEnLista(this.incidencias, incidencia, false);
    this.upsertEnLista(this.misIncidencias, incidencia, false, true);
  }

  aplicarEliminacionLocal(idIncidencia: number): void {
    this.incidencias.update((lista) => lista.filter((item) => item.idIncidencia !== idIncidencia));
    this.misIncidencias.update((lista) => lista.filter((item) => item.idIncidencia !== idIncidencia));
  }

  detener(): void {
    this.activo = false;
    this.conectando = false;
    this.intentosReconexion = 0;
    this.conectadoTiempoReal.set(false);

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.incidencias.set([]);
    this.misIncidencias.set([]);
  }

  private async conectarStream(): Promise<void> {
    if (!this.activo || this.conectando) return;

    const token = this.authService.getToken();
    if (!token || !this.authService.estaLogueado()) {
      this.detener();
      return;
    }

    this.conectando = true;
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${environment.apiUrl}/incidencia/stream`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: this.abortController.signal,
      });

      if (response.status === 401) {
        this.ngZone.run(() => {
          this.detener();
          this.authService.logout();
          this.router.navigate(['/login']);
        });
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      this.ngZone.run(() => {
        this.conectadoTiempoReal.set(true);
        if (this.intentosReconexion > 0) {
          this.cargarTodas();
          if (this.misIncidencias().length > 0) {
            this.cargarMisIncidencias();
          }
        }
        this.intentosReconexion = 0;
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (this.activo) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, '\n');

        let boundaryIndex = buffer.indexOf('\n\n');
        while (boundaryIndex !== -1) {
          const bloque = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          this.procesarBloqueSse(bloque);
          boundaryIndex = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') {
        return;
      }
    } finally {
      this.conectando = false;
      this.ngZone.run(() => {
        this.conectadoTiempoReal.set(false);
      });
      if (this.activo) {
        this.programarReconexion();
      }
    }
  }

  private procesarBloqueSse(bloque: string): void {
    const lineas = bloque.split('\n');
    let nombreEvento = 'message';
    const dataLineas: string[] = [];

    for (const linea of lineas) {
      if (!linea || linea.startsWith(':')) continue;
      if (linea.startsWith('event:')) {
        nombreEvento = linea.slice(6).trim();
      } else if (linea.startsWith('data:')) {
        dataLineas.push(linea.slice(5).trimStart());
      }
    }

    if (dataLineas.length === 0) return;
    const rawData = dataLineas.join('\n');

    if (nombreEvento === 'conectado') {
      this.ngZone.run(() => this.conectadoTiempoReal.set(true));
      return;
    }

    try {
      const payload = JSON.parse(rawData) as Incidencia & { idIncidencia: number };

      this.ngZone.run(() => {
        if (nombreEvento === 'incidencia-creada') {
          this.upsertEnLista(this.incidencias, payload, true);
          this.eventosSubject.next({
            tipo: 'CREADA',
            incidencia: payload,
            idIncidencia: payload.idIncidencia,
          });
        } else if (nombreEvento === 'incidencia-actualizada') {
          this.upsertEnLista(this.incidencias, payload, false);
          this.upsertEnLista(this.misIncidencias, payload, false, true);
          this.eventosSubject.next({
            tipo: 'ACTUALIZADA',
            incidencia: payload,
            idIncidencia: payload.idIncidencia,
          });
        } else if (nombreEvento === 'incidencia-eliminada') {
          this.aplicarEliminacionLocal(payload.idIncidencia);
          this.eventosSubject.next({
            tipo: 'ELIMINADA',
            idIncidencia: payload.idIncidencia,
          });
        }
      });
    } catch {
      // Ignora payloads no JSON
    }
  }

  private programarReconexion(): void {
    if (!this.activo || this.reconnectTimer) return;
    const delayMs = Math.min(2000 * Math.pow(2, this.intentosReconexion), 15000);
    this.intentosReconexion++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.conectarStream();
    }, delayMs);
  }

  private upsertEnLista(
    objetivo: ReturnType<typeof signal<Incidencia[]>>,
    incidencia: Incidencia,
    insertarAlInicio: boolean,
    soloSiExiste = false,
  ): void {
    objetivo.update((lista) => {
      const index = lista.findIndex((item) => item.idIncidencia === incidencia.idIncidencia);
      if (index !== -1) {
        const copia = [...lista];
        copia[index] = incidencia;
        return copia;
      }
      if (soloSiExiste) {
        return lista;
      }
      return insertarAlInicio ? [incidencia, ...lista] : [...lista, incidencia];
    });
  }

  private ordenarPorReciente(lista: Incidencia[]): Incidencia[] {
    return [...lista].sort((a, b) => (b.idIncidencia ?? 0) - (a.idIncidencia ?? 0));
  }
}
