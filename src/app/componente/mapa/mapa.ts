import {
  AfterViewInit,
  Component,
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

import { IncidenciaService } from '../../services/incidencia-service';
import { CategoriaService } from '../../services/categoria-service';
import { EvidenciaService } from '../../services/evidencia-service';
import { Incidencia } from '../../model/incidencia';
import { Categoria } from '../../model/categoria';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapaComunitario') mapaElemento!: ElementRef<HTMLDivElement>;

  private incidenciaService = inject(IncidenciaService);
  private categoriaService = inject(CategoriaService);
  private evidenciaService = inject(EvidenciaService);
  private router = inject(Router);

  private mapa?: L.Map;
  private capaMarcadores = L.layerGroup();

  categorias = signal<Categoria[]>([]);
  categoriasSeleccionadas = signal<Set<number>>(new Set());
  estadoFiltro = signal<string>('TODOS');
  rangoFecha = signal<string>('30');

  todasIncidencias = signal<Incidencia[]>([]);
  incidenciasFiltradas = signal<Incidencia[]>([]);
  incidenciaSeleccionada = signal<Incidencia | null>(null);
  fotoSeleccionada = signal<string | null>(null);

  apoyosVecinales = signal<Record<number, { count: number; apoyado: boolean }>>({});
  mostrarCalificacion = signal<boolean>(false);
  estrellasSeleccionadas = signal<number>(5);
  calificacionGuardada = signal<boolean>(false);

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (cats) => {
        this.categorias.set(cats);
        const ids = new Set(cats.map((c) => c.idCategoria));
        this.categoriasSeleccionadas.set(ids);
        this.cargarIncidencias();
      },
      error: () => this.cargarIncidencias(),
    });
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
  }

  private cargarIncidencias(): void {
    this.incidenciaService.listar().subscribe({
      next: (data) => {
        this.todasIncidencias.set(data);
        const apoyosIniciales: Record<number, { count: number; apoyado: boolean }> = {};
        data.forEach((inc) => {
          apoyosIniciales[inc.idIncidencia] = {
            count: (inc.idIncidencia % 19) + 6,
            apoyado: false,
          };
        });
        this.apoyosVecinales.set(apoyosIniciales);
        this.aplicarFiltros();
      },
    });
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
      const sigueVisible = actual && filtradas.some((i) => i.idIncidencia === actual.idIncidencia);
      if (!sigueVisible) {
        this.seleccionarIncidencia(filtradas[0], false);
      } else {
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
    this.fotoSeleccionada.set(null);

    this.evidenciaService.buscarPorIncidencia(inc.idIncidencia).subscribe({
      next: (evidencias) => {
        if (evidencias && evidencias.length > 0) {
          this.fotoSeleccionada.set(evidencias[0].urlArchivo);
        }
      },
    });

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

      const textoPin = esSeleccionada ? 'Seleccionado' : `${inc.categoria?.nombre || inc.titulo}`;

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
  }

  guardarCalificacion(): void {
    this.calificacionGuardada.set(true);
    setTimeout(() => {
      this.mostrarCalificacion.set(false);
    }, 1200);
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

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
