import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { IncidenciaService } from '../../services/incidencia-service';
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
  private incidenciaService = inject(IncidenciaService);
  authService = inject(AuthService);
  private router = inject(Router);

  incidencias = signal<Incidencia[]>([]);
  cargando = signal<boolean>(true);
  busqueda = signal<string>('');
  filtroEstado = signal<string>('TODOS');

  esAdmin = computed(() => this.authService.getRol() === 'ADMINISTRADOR');

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
    this.cargarLista();
  }

  cargarLista(): void {
    this.cargando.set(true);
    const peticion = this.esAdmin()
      ? this.incidenciaService.listar()
      : this.incidenciaService.listarMisIncidencias();

    peticion.subscribe({
      next: (data) => {
        this.incidencias.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  verDetalle(incidencia: Incidencia): void {
    this.router.navigate(['/incidencia-detalle', incidencia.idIncidencia]);
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
