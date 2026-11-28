import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Calificacion, CalificacionService } from '../../services/calificacion-service';

@Component({
  selector: 'app-calificacion-form',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  styleUrl: './calificacion-form.css',
  templateUrl: './calificacion-form.html',
})
export class CalificacionForm implements OnInit {
  private calificacionService = inject(CalificacionService);
  private router = inject(Router);

  calificaciones = signal<Calificacion[]>([]);
  cargando = signal<boolean>(true);
  filtroEstrellas = signal<number>(0);

  detalleCalificacion = signal<Calificacion | null>(null);
  cargandoDetalle = signal<boolean>(false);

  promedio = computed(() => {
    const lista = this.calificaciones();
    if (lista.length === 0) return '0.0';
    const suma = lista.reduce((acc, c) => acc + (c.puntuacion || 0), 0);
    return (suma / lista.length).toFixed(1);
  });

  cincoEstrellas = computed(
    () => this.calificaciones().filter((c) => c.puntuacion === 5).length,
  );

  calificacionesFiltradas = computed(() => {
    const f = this.filtroEstrellas();
    if (f === 0) return this.calificaciones();
    return this.calificaciones().filter((c) => c.puntuacion === f);
  });

  ngOnInit(): void {
    this.cargarCalificaciones();
  }

  cargarCalificaciones(): void {
    this.cargando.set(true);
    this.calificacionService.listar().subscribe({
      next: (data) => {
        this.calificaciones.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  verDetalle(cal: Calificacion): void {
    this.detalleCalificacion.set(cal);
    if (!cal.idCalificacion) return;
    this.cargandoDetalle.set(true);
    this.calificacionService.buscarPorId(cal.idCalificacion).subscribe({
      next: (det) => {
        this.detalleCalificacion.set(det);
        this.cargandoDetalle.set(false);
      },
      error: () => this.cargandoDetalle.set(false),
    });
  }

  irAIncidencia(idIncidencia: number): void {
    this.detalleCalificacion.set(null);
    this.router.navigate(['/incidencia-detalle', idIncidencia]);
  }
}
