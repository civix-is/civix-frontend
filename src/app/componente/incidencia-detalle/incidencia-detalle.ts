import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { IncidenciaService } from '../../services/incidencia-service';
import { HistorialIncidenciaService } from '../../services/historial-incidencia-service';
import { EvidenciaService } from '../../services/evidencia-service';
import { AuthService } from '../../services/auth-service';
import { Incidencia } from '../../model/incidencia';

@Component({
  selector: 'app-incidencia-detalle',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  styleUrl: './incidencia-detalle.css',
  templateUrl: './incidencia-detalle.html',
})
export class IncidenciaDetalle implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapaDetalle') mapaElemento?: ElementRef<HTMLDivElement>;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private incidenciaService = inject(IncidenciaService);
  private historialService = inject(HistorialIncidenciaService);
  private evidenciaService = inject(EvidenciaService);
  authService = inject(AuthService);

  private mapa?: L.Map;
  idIncidencia = 0;

  incidencia = signal<Incidencia | null>(null);
  historial = signal<any[]>([]);
  evidencias = signal<any[]>([]);
  cargando = signal<boolean>(true);

  guardandoAvance = signal<boolean>(false);
  mensajeExito = signal<string>('');
  mensajeError = signal<string>('');

  esAdmin = computed(() => this.authService.getRol() === 'ADMINISTRADOR');

  // Transiciones permitidas según IncidenciaServicioImpl en el backend
  estadosDisponibles = computed(() => {
    const actual = this.incidencia()?.estadoAtencion;
    if (actual === 'PENDIENTE') {
      return [
        { valor: 'PENDIENTE', etiqueta: 'Mantener en Recibido (Pendiente)' },
        { valor: 'EN_PROCESO', etiqueta: 'Pasar a En Proceso (Asignar cuadrilla)' },
      ];
    }
    if (actual === 'EN_PROCESO') {
      return [
        { valor: 'EN_PROCESO', etiqueta: 'Mantener En Proceso (Documentar avance)' },
        { valor: 'ATENDIDO', etiqueta: 'Marcar como Resuelto (Atendido)' },
        { valor: 'RECHAZADO', etiqueta: 'Marcar como Rechazado' },
      ];
    }
    return [];
  });

  gestionForm: FormGroup = this.fb.group({
    estadoAtencion: ['', Validators.required],
    prioridad: ['MEDIA', Validators.required],
    areaAsignada: ['Cuadrilla Municipal', Validators.required],
    comentario: ['', [Validators.required, Validators.minLength(5)]],
  });

  ngOnInit(): void {
    this.idIncidencia = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idIncidencia) {
      this.cargarTodo();
    }
  }

  ngAfterViewInit(): void {
    if (this.incidencia()) {
      this.iniciarMapa();
    }
  }

  cargarTodo(): void {
    this.cargando.set(true);

    this.incidenciaService.buscarporId(this.idIncidencia).subscribe({
      next: (data) => {
        this.incidencia.set(data);
        this.cargando.set(false);

        this.gestionForm.patchValue({
          estadoAtencion: data.estadoAtencion,
          prioridad: data.prioridad || 'MEDIA',
          areaAsignada: data.categoria?.nombre || 'Área Operativa Municipal',
        });

        setTimeout(() => this.iniciarMapa(), 50);
      },
      error: () => this.cargando.set(false),
    });

    this.historialService.buscarPorIncidencia(this.idIncidencia).subscribe({
      next: (items) => {
        // Orden cronológico ascendente para la línea de tiempo (de más antiguo a más reciente)
        const ordenados = [...items].sort(
          (a, b) => new Date(a.fechaCambio).getTime() - new Date(b.fechaCambio).getTime(),
        );
        this.historial.set(ordenados);
      },
    });

    this.evidenciaService.buscarPorIncidencia(this.idIncidencia).subscribe({
      next: (fotos) => this.evidencias.set(fotos),
    });
  }

  private iniciarMapa(): void {
    const inc = this.incidencia();
    if (!inc || !this.mapaElemento) return;

    if (this.mapa) {
      this.mapa.remove();
    }

    const lat = inc.latitud ?? -12.0464;
    const lng = inc.longitud ?? -77.0428;

    this.mapa = L.map(this.mapaElemento.nativeElement, {
      zoomControl: false,
    }).setView([lat, lng], 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.mapa);

    const pinIcon = L.divIcon({
      className: 'detail-pin-wrapper',
      html: `<div class="detail-map-tag">${inc.direccionReferencia || 'Ubicación reportada'}</div>`,
      iconSize: [220, 34],
      iconAnchor: [110, 17],
    });

    L.marker([lat, lng], { icon: pinIcon }).addTo(this.mapa);
  }

  guardarAvanceAdmin(): void {
    const inc = this.incidencia();
    if (!inc || this.gestionForm.invalid) {
      this.gestionForm.markAllAsTouched();
      this.mensajeError.set('Completa el área asignada y el comentario del avance.');
      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.guardandoAvance.set(true);

    const formVal = this.gestionForm.value;

    // Si el admin eligió mantener el mismo estado pero documentar un avance,
    // registramos directamente en historial-incidencia y actualizamos prioridad si cambió.
    if (formVal.estadoAtencion === inc.estadoAtencion) {
      const idUsuarioActual = this.historial()[0]?.idUsuario || 2;
      this.historialService
        .registrar({
          estadoAnterior: inc.estadoAtencion,
          estadoNuevo: inc.estadoAtencion,
          comentario: formVal.comentario,
          areaAsignada: formVal.areaAsignada,
          usuarioAccion: this.authService.nombreUsuario() || 'Administrador Municipal',
          idIncidencia: inc.idIncidencia,
          idUsuario: idUsuarioActual,
        })
        .subscribe({
          next: () => {
            this.guardandoAvance.set(false);
            this.mensajeExito.set('Avance documentado correctamente en la línea de tiempo.');
            this.gestionForm.patchValue({ comentario: '' });
            this.cargarTodo();
          },
          error: (err) => {
            this.guardandoAvance.set(false);
            this.mensajeError.set(err?.error?.message || 'No se pudo registrar el avance.');
          },
        });
      return;
    }

    // Si cambió de estado (ej. PENDIENTE -> EN_PROCESO o EN_PROCESO -> ATENDIDO/RECHAZADO),
    // IncidenciaControlador.actualizar valida la transición y crea el historial automáticamente.
    this.incidenciaService
      .actualizar({
        idIncidencia: inc.idIncidencia,
        titulo: inc.titulo,
        descripcion: inc.descripcion,
        estadoAtencion: formVal.estadoAtencion,
        prioridad: formVal.prioridad,
        comentario: formVal.comentario,
        areaAsignada: formVal.areaAsignada,
        idCategoria: inc.categoria?.idCategoria,
      })
      .subscribe({
        next: () => {
          this.guardandoAvance.set(false);
          this.mensajeExito.set('Estado actualizado y avance registrado en la línea de tiempo.');
          this.gestionForm.patchValue({ comentario: '' });
          this.cargarTodo();
        },
        error: (err) => {
          this.guardandoAvance.set(false);
          this.mensajeError.set(
            err?.error?.message || 'Error al actualizar el estado de la incidencia.',
          );
        },
      });
  }

  calcularPorcentajeSLA(): number {
    const inc = this.incidencia();
    if (!inc) return 0;
    if (inc.estadoAtencion === 'ATENDIDO' || inc.estadoAtencion === 'RECHAZADO') return 100;
    if (inc.estadoAtencion === 'EN_PROCESO') return 65;
    return 25;
  }

  volver(): void {
    this.router.navigate(['/mis-incidencias']);
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
