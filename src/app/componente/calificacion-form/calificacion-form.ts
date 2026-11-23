import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { CalificacionService } from '../../services/calificacion-service';
import { Calificacion } from '../../model/calificación';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [],
  selector: 'app-calificacion-form',
  styleUrl: './calificacion-form.css',
  templateUrl: './calificacion-form.html',
})
export class CalificacionForm {
  private readonly servicio = inject(CalificacionService);
  private readonly destroyRef = inject(DestroyRef);

  idIncidencia = input.required<number>();
  editable = input(false);

  readonly estrellas = [1, 2, 3, 4, 5];
  calificacion = signal<Calificacion | null>(null);
  puntuacion = signal(0);
  comentario = signal('');
  cargando = signal(true);
  guardando = signal(false);
  errorConsulta = signal(false);
  errorEnvio = signal('');

  ngOnInit(): void {
    this.consultar();
  }

  private consultar(): void {
    this.cargando.set(true);
    this.errorConsulta.set(false);

    this.servicio
      .buscarPorIncidencia(this.idIncidencia())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (calificacion) => {
          this.calificacion.set(calificacion);
          this.errorEnvio.set('');
        },
        error: (error: HttpErrorResponse) => {
          this.errorConsulta.set(error.status !== 404);
        },
      });
  }

  guardar(): void {
    const puntuacion = this.puntuacion();

    if (
      !this.editable() ||
      this.cargando() ||
      this.errorConsulta() ||
      this.guardando() ||
      this.calificacion() ||
      puntuacion < 1 ||
      puntuacion > 5
    ) {
      return;
    }

    this.guardando.set(true);
    this.errorEnvio.set('');

    this.servicio
      .registrar({
        idIncidencia: this.idIncidencia(),
        puntuacion,
        comentario: this.comentario().trim() || null,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.guardando.set(false)),
      )
      .subscribe({
        next: (calificacion) => this.calificacion.set(calificacion),
        error: (error: HttpErrorResponse) => {
          this.errorEnvio.set(error.error?.message || 'No se pudo guardar la calificación.');

          if (error.error?.code === 'DUPLICATE_RESOURCE') {
            this.consultar();
          }
        },
      });
  }
}
