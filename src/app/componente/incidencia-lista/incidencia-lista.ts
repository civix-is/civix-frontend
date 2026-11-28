import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IncidenciaRealtimeService } from '../../services/incidencia-realtime.service';
import { IncidenciaService } from '../../services/incidencia-service';
import { HistorialIncidenciaService } from '../../services/historial-incidencia-service';
import { AuthService } from '../../services/auth-service';
import { Incidencia } from '../../model/incidencia';

@Component({
  selector: 'app-incidencia-lista',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule, MatButtonModule],
  styleUrl: './incidencia-lista.css',
  templateUrl: './incidencia-lista.html',
})
export class IncidenciaLista implements OnInit {
  readonly realtime = inject(IncidenciaRealtimeService);
  private incidenciaService = inject(IncidenciaService);
  private historialService = inject(HistorialIncidenciaService);
  authService = inject(AuthService);
  router = inject(Router);

  incidencias = signal<Incidencia[]>([]);
  cargando = signal<boolean>(true);
  busqueda = signal<string>('');
  filtroEstado = signal<string>('TODOS');

  vistaActual = signal<'REPORTES' | 'BITACORA'>('REPORTES');
  bitacoraUsuario = signal<any[]>([]);
  cargandoBitacora = signal<boolean>(false);

  incidenciaAEliminar = signal<Incidencia | null>(null);
  eliminando = signal<boolean>(false);
  errorAccion = signal<string>('');

  esAdmin = computed(() => this.authService.getRol() === 'ADMINISTRADOR');

  constructor() {
    effect(() => {
      const lista = this.esAdmin()
        ? this.realtime.incidencias()
        : this.realtime.misIncidencias();
      this.incidencias.set(lista);
      this.cargando.set(
        this.esAdmin() ? this.realtime.cargando() : this.realtime.cargandoMias(),
      );
    });
  }

  incidenciasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();

    return this.incidencias().filter((inc) => {
      const coincideEstado = estado === 'TODOS' || inc.estadoAtencion === estado;
      if (!coincideEstado) return false;

      if (!texto) return true;
      const ticket = (inc.codigoIncidencia || '').toLowerCase();
      const titulo = (inc.titulo || '').toLowerCase();
      const direccion = (inc.direccionReferencia || '').toLowerCase();
      const categoria = (inc.categoria?.nombre || '').toLowerCase();

      return (
        ticket.includes(texto) ||
        titulo.includes(texto) ||
        direccion.includes(texto) ||
        categoria.includes(texto)
      );
    });
  });

  ngOnInit(): void {
    this.realtime.asegurarConexion();
    this.cargarLista();
  }

  cargarLista(): void {
    if (this.esAdmin()) {
      this.realtime.cargarTodas();
    } else {
      this.realtime.cargarMisIncidencias();
    }
  }

  verDetalle(incidencia: Incidencia): void {
    this.router.navigate(['/incidencia-detalle', incidencia.idIncidencia]);
  }

  cambiarVista(vista: 'REPORTES' | 'BITACORA'): void {
    this.vistaActual.set(vista);
    if (vista === 'BITACORA') {
      this.cargarBitacoraPersonal();
    }
  }

  cargarBitacoraPersonal(): void {
    const idUsuario = this.authService.idUsuario();
    if (!idUsuario) return;
    this.cargandoBitacora.set(true);
    this.historialService.buscarPorUsuario(idUsuario).subscribe({
      next: (eventos) => {
        this.bitacoraUsuario.set(eventos);
        this.cargandoBitacora.set(false);
      },
      error: () => this.cargandoBitacora.set(false),
    });
  }

  solicitarEliminar(incidencia: Incidencia, event: Event): void {
    event.stopPropagation();
    this.errorAccion.set('');
    this.incidenciaAEliminar.set(incidencia);
  }

  cancelarEliminar(): void {
    this.incidenciaAEliminar.set(null);
    this.errorAccion.set('');
  }

  confirmarEliminar(): void {
    const inc = this.incidenciaAEliminar();
    if (!inc || this.eliminando()) return;
    this.eliminando.set(true);
    this.errorAccion.set('');

    this.incidenciaService.eliminar(inc.idIncidencia).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.incidenciaAEliminar.set(null);
      },
      error: (err) => {
        this.eliminando.set(false);
        this.errorAccion.set(err?.error?.message || 'No se pudo eliminar la incidencia.');
      },
    });
  }

  obtenerProgreso(estado: string): number {
    switch (estado) {
      case 'PENDIENTE':
        return 25;
      case 'EN_PROCESO':
        return 50;
      case 'ATENDIDO':
      case 'RECHAZADO':
        return 100;
      default:
        return 25;
    }
  }

  obtenerEtiquetaEstado(estado: string): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'Recibido';
      case 'EN_PROCESO':
        return 'En Proceso';
      case 'ATENDIDO':
        return 'Resuelto';
      case 'RECHAZADO':
        return 'Rechazado';
      default:
        return estado;
    }
  }
}
