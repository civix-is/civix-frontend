import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as L from 'leaflet';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { IncidenciaRealtimeService } from '../../services/incidencia-realtime.service';
import { CategoriaService } from '../../services/categoria-service';
import { EvidenciaService } from '../../services/evidencia-service';
import { CalificacionService } from '../../services/calificacion-service';
import { Incidencia } from '../../model/incidencia';
import { Categoria } from '../../model/categoria';
import { AuthService } from '../../services/auth-service';
@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapaComunitario') mapaElemento!: ElementRef<HTMLDivElement>;

  readonly realtime = inject(IncidenciaRealtimeService);
  private categoriaService = inject(CategoriaService);
  private evidenciaService = inject(EvidenciaService);
  private calificacionService = inject(CalificacionService);
  private router = inject(Router);

  private mapa?: L.Map;
  private capaMarcadores = L.layerGroup();

  private readonly STORAGE_APOYOS = 'civix_apoyos_vecinales';
  private readonly STORAGE_CALIFICACIONES = 'civix_calificaciones_mapa';
  private readonly authService = inject(AuthService);

  categorias = signal<Categoria[]>([]);
  categoriasSeleccionadas = signal<Set<number>>(new Set());
  estadoFiltro = signal<string>('TODOS');
  rangoFecha = signal<string>('30');

  todasIncidencias = signal<Incidencia[]>([]);
  incidenciasFiltradas = signal<Incidencia[]>([]);
  incidenciaSeleccionada = signal<Incidencia | null>(null);
  fotoSeleccionada = signal<string | null>(null);

  apoyosVecinales = signal<Record<number, { count: number; apoyado: boolean }>>({});
  calificacionesGuardadas = signal<Record<number, number>>({});

  mostrarCalificacion = signal<boolean>(false);
  estrellasSeleccionadas = signal<number>(5);
  comentarioCalificacion = signal<string>('');
  enviandoCalificacion = signal<boolean>(false);
  calificacionGuardada = signal<boolean>(false);
  errorCalificacion = signal<string>('');

  constructor() {
    effect(() => {
      const data = this.realtime.incidencias();
      this.todasIncidencias.set(data);

      if (data.length > 0) {
        const apoyosActuales = { ...this.apoyosVecinales() };
        let huboNuevos = false;
        data.forEach((inc) => {
          if (!apoyosActuales[inc.idIncidencia]) {
            apoyosActuales[inc.idIncidencia] = {
              count: (inc.idIncidencia % 19) + 6,
              apoyado: false,
            };
            huboNuevos = true;
          }
        });
        if (huboNuevos) {
          this.apoyosVecinales.set(apoyosActuales);
          localStorage.setItem(this.STORAGE_APOYOS, JSON.stringify(apoyosActuales));
        }
      }

      this.aplicarFiltros();
    });
  }

  ngOnInit(): void {
    this.cargarPersistenciaLocal();
    this.realtime.asegurarConexion();

    this.categoriaService.listar().subscribe({
      next: (cats) => {
        this.categorias.set(cats);
        const ids = new Set(cats.map((c) => c.idCategoria));
        this.categoriasSeleccionadas.set(ids);
        this.realtime.cargarTodas();
      },
      error: () => this.realtime.cargarTodas(),
    });
  }
  puedeCalificar(incidencia: Incidencia): boolean {
    return incidencia.estadoAtencion === 'ATENDIDO' && this.authService.getRol() === 'CIUDADANO';
  }
  private cargarPersistenciaLocal(): void {
    const apoyosRaw = localStorage.getItem(this.STORAGE_APOYOS);
    if (apoyosRaw) {
      this.apoyosVecinales.set(JSON.parse(apoyosRaw));
    }

    const califRaw = localStorage.getItem(this.STORAGE_CALIFICACIONES);
    if (califRaw) {
      this.calificacionesGuardadas.set(JSON.parse(califRaw));
    }
  }

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  private iniciarMapa(): void {
    this.mapa = L.map(this.mapaElemento.nativeElement, {
      zoomControl: false,
    }).setView([-12.0931, -77.0465], 14);

    L.control.zoom({ position: 'topright' }).addTo(this.mapa);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.mapa);

    this.capaMarcadores.addTo(this.mapa);
    this.renderizarMarcadores();
  }

  toggleCategoria(idCategoria: number, checked: boolean): void {
    const copia = new Set(this.categoriasSeleccionadas());
    if (checked) {
      copia.add(idCategoria);
    } else {
      copia.delete(idCategoria);
    }
    this.categoriasSeleccionadas.set(copia);
  }

  aplicarFiltros(): void {
    const cats = this.categoriasSeleccionadas();
    const estado = this.estadoFiltro();
    const dias = Number(this.rangoFecha());
    const limiteFecha = Date.now() - dias * 24 * 60 * 60 * 1000;

    const filtradas = this.todasIncidencias().filter((inc) => {
      const catId = inc.categoria?.idCategoria;
      const coincideCat = cats.size === 0 || (catId !== undefined && cats.has(catId));
      const coincideEstado = estado === 'TODOS' || inc.estadoAtencion === estado;
      const fechaReg = inc.fechaRegistro ? new Date(inc.fechaRegistro).getTime() : Date.now();
      const coincideFecha = dias === 0 || fechaReg >= limiteFecha;

      return coincideCat && coincideEstado && coincideFecha;
    });

    this.incidenciasFiltradas.set(filtradas);

    const actual = this.incidenciaSeleccionada();
    if (filtradas.length > 0) {
      const actualEnLista = actual
        ? filtradas.find((i) => i.idIncidencia === actual.idIncidencia)
        : undefined;
      if (!actualEnLista) {
        this.seleccionarIncidencia(filtradas[0], false);
      } else {
        this.incidenciaSeleccionada.set(actualEnLista);
        this.renderizarMarcadores();
      }
    } else {
      this.incidenciaSeleccionada.set(null);
      this.capaMarcadores.clearLayers();
    }
  }

  seleccionarIncidencia(inc: Incidencia, centrar = true): void {
    this.incidenciaSeleccionada.set(inc);
    this.mostrarCalificacion.set(false);
    this.calificacionGuardada.set(false);
    this.errorCalificacion.set('');
    this.comentarioCalificacion.set('');
    this.fotoSeleccionada.set(null);

    const previa = this.calificacionesGuardadas()[inc.idIncidencia];
    this.estrellasSeleccionadas.set(previa ?? 5);

    this.evidenciaService.buscarPorIncidencia(inc.idIncidencia).subscribe({
      next: (evidencias) => {
        if (evidencias && evidencias.length > 0) {
          this.fotoSeleccionada.set(evidencias[0].urlArchivo);
        }
      },
    });

    if (inc.estadoAtencion === 'ATENDIDO') {
      this.calificacionService.buscarPorIncidencia(inc.idIncidencia).subscribe({
        next: (cal) => {
          if (cal?.puntuacion) {
            this.estrellasSeleccionadas.set(cal.puntuacion);
            this.comentarioCalificacion.set(cal.comentario || '');
            this.calificacionGuardada.set(true);
          }
        },
        error: () => {
          // Sin calificación previa en backend
        },
      });
    }

    this.renderizarMarcadores();

    if (centrar && this.mapa && inc.latitud && inc.longitud) {
      this.mapa.setView([inc.latitud, inc.longitud], 16, { animate: true });
    }
  }

  private renderizarMarcadores(): void {
    if (!this.mapa) return;
    this.capaMarcadores.clearLayers();

    const seleccionadaId = this.incidenciaSeleccionada()?.idIncidencia;

    this.incidenciasFiltradas().forEach((inc) => {
      if (!inc.latitud || !inc.longitud) return;

      const esSeleccionada = inc.idIncidencia === seleccionadaId;
      const colorClase = esSeleccionada
        ? 'dot-blue'
        : inc.estadoAtencion === 'ATENDIDO'
          ? 'dot-green'
          : inc.estadoAtencion === 'EN_PROCESO'
            ? 'dot-amber'
            : 'dot-red';

      const textoPin = this.escaparHtml(
        esSeleccionada ? 'Seleccionado' : `${inc.categoria?.nombre || inc.titulo}`,
      );

      const icono = L.divIcon({
        className: 'map-pill-wrapper',
        html: `
          <div class="map-pill-badge ${esSeleccionada ? 'selected' : ''}">
            <span class="pill-dot ${colorClase}"></span>
            <span>${textoPin}</span>
          </div>
        `,
        iconSize: [160, 34],
        iconAnchor: [80, 17],
      });

      const marker = L.marker([inc.latitud, inc.longitud], { icon: icono });
      marker.on('click', () => this.seleccionarIncidencia(inc, true));
      marker.addTo(this.capaMarcadores);
    });
  }

  ubicarEnMapa(): void {
    const inc = this.incidenciaSeleccionada();
    if (this.mapa && inc?.latitud && inc?.longitud) {
      this.mapa.setView([inc.latitud, inc.longitud], 17, { animate: true });
    }
  }

  irADetalle(): void {
    const inc = this.incidenciaSeleccionada();
    if (inc) {
      this.router.navigate(['/incidencia-detalle', inc.idIncidencia]);
    }
  }

  toggleApoyoVecinal(): void {
    const inc = this.incidenciaSeleccionada();
    if (!inc) return;

    const mapaApoyos = { ...this.apoyosVecinales() };
    const actual = mapaApoyos[inc.idIncidencia] || { count: 10, apoyado: false };
    mapaApoyos[inc.idIncidencia] = {
      count: actual.apoyado ? actual.count - 1 : actual.count + 1,
      apoyado: !actual.apoyado,
    };
    this.apoyosVecinales.set(mapaApoyos);
    localStorage.setItem(this.STORAGE_APOYOS, JSON.stringify(mapaApoyos));
  }

  guardarCalificacion(): void {
    const inc = this.incidenciaSeleccionada();
    if (!inc || this.enviandoCalificacion()) return;

    this.errorCalificacion.set('');
    this.enviandoCalificacion.set(true);

    this.calificacionService
      .registrar({
        idIncidencia: inc.idIncidencia,
        puntuacion: this.estrellasSeleccionadas(),
        comentario: this.comentarioCalificacion().trim() || null,
      })
      .subscribe({
        next: () => {
          this.enviandoCalificacion.set(false);
          const actualizadas = {
            ...this.calificacionesGuardadas(),
            [inc.idIncidencia]: this.estrellasSeleccionadas(),
          };
          this.calificacionesGuardadas.set(actualizadas);
          localStorage.setItem(this.STORAGE_CALIFICACIONES, JSON.stringify(actualizadas));

          this.calificacionGuardada.set(true);
          setTimeout(() => {
            this.mostrarCalificacion.set(false);
          }, 1200);
        },
        error: (err) => {
          this.enviandoCalificacion.set(false);
          this.errorCalificacion.set(
            err?.error?.message ||
              'Solo el autor puede calificar incidencias en estado ATENDIDO (máx. 1 vez).',
          );
        },
      });
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

  private escaparHtml(texto: string): string {
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
