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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { IncidenciaService } from '../../services/incidencia-service';
import { CategoriaService } from '../../services/categoria-service';
import { EvidenciaService } from '../../services/evidencia-service';
import { IaService } from '../../services/ia-service';
import { Categoria } from '../../model/categoria';
import { Incidencia } from '../../model/incidencia';
import { IncidenciaRegistro } from '../../model/incidencia-registro';

interface FotoPreview {
  file: File;
  url: string;
}

@Component({
  selector: 'app-incidencia-crear',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  styleUrl: './incidencia-crear.css',
  templateUrl: './incidencia-crear.html',
})
export class IncidenciaCrear implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapa') mapaElemento?: ElementRef<HTMLDivElement>;
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  incidenciaForm: FormGroup;
  fb = inject(FormBuilder);
  incidenciaService = inject(IncidenciaService);
  categoriaService = inject(CategoriaService);
  evidenciaService = inject(EvidenciaService);
  iaService = inject(IaService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  private mapa?: L.Map;
  private marcador?: L.Marker;
  private seleccionActual = 0;

  categorias = signal<Categoria[]>([]);
  mejorandoIA = signal(false);
  sugerenciaIA = signal('');
  errorIA = signal('');

  enviando = signal(false);
  errorEnvio = signal('');
  reporteEnviado = signal<Incidencia | null>(null);

  fotos = signal<FotoPreview[]>([]);
  errorFotos = signal('');

  buscandoDireccion = false;
  mensajeMapa = '';

  constructor() {
    this.incidenciaForm = this.fb.group({
      titulo: ['Reporte Ciudadano', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      direccionReferencia: ['', Validators.required],
      latitud: [-12.0914, Validators.required],
      longitud: [-77.0182, Validators.required],
      prioridad: ['MEDIA', Validators.required],
      idCategoria: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data.filter((c) => c.estado)),
      error: () => (this.mensajeMapa = 'No se pudieron cargar las categorías del servidor.'),
    });
  }

  ngAfterViewInit(): void {
    this.inicializarMapa();
  }

  private inicializarMapa(): void {
    if (!this.mapaElemento) return;

    const latInicial = this.incidenciaForm.value.latitud ?? -12.0914;
    const lngInicial = this.incidenciaForm.value.longitud ?? -77.0182;

    this.mapa = L.map(this.mapaElemento.nativeElement).setView([latInicial, lngInicial], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.mapa);

    const iconoPinRojo = L.divIcon({
      className: 'custom-pin-wrapper',
      html: `
        <div class="pin-container">
          <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0ZM12 16.5C9.51 16.5 7.5 14.49 7.5 12C7.5 9.51 9.51 7.5 12 7.5C14.49 7.5 16.5 9.51 16.5 12C16.5 14.49 14.49 16.5 12 16.5Z" fill="#E53935"/>
            <circle cx="12" cy="12" r="4.5" fill="white"/>
          </svg>
          <span class="pin-tooltip">Arrastra para ajustar</span>
        </div>
      `,
      iconSize: [140, 68],
      iconAnchor: [70, 40],
    });

    this.marcador = L.marker([latInicial, lngInicial], {
      draggable: true,
      icon: iconoPinRojo,
    }).addTo(this.mapa);

    this.marcador.on('dragend', () => {
      const pos = this.marcador!.getLatLng();
      this.seleccionarUbicacion(pos.lat, pos.lng);
    });

    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
      this.seleccionarUbicacion(evento.latlng.lat, evento.latlng.lng);
    });

    this.seleccionarUbicacion(latInicial, lngInicial);
  }

  seleccionarUbicacion(latitud: number, longitud: number): void {
    if (!this.mapa) return;

    const seleccion = ++this.seleccionActual;
    const latRedondeada = Number(latitud.toFixed(5));
    const lngRedondeada = Number(longitud.toFixed(5));

    this.marcador?.setLatLng([latRedondeada, lngRedondeada]);

    this.incidenciaForm.patchValue({
      latitud: latRedondeada,
      longitud: lngRedondeada,
    });

    this.buscandoDireccion = true;
    this.mensajeMapa = '';

    this.http
      .get<{ display_name?: string }>('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latRedondeada.toString(),
          lon: lngRedondeada.toString(),
          format: 'jsonv2',
          'accept-language': 'es',
        },
      })
      .subscribe({
        next: (resultado) => {
          if (seleccion !== this.seleccionActual) return;
          this.buscandoDireccion = false;

          if (resultado.display_name) {
            const partes = resultado.display_name.split(',').slice(0, 3).join(',').trim();
            this.incidenciaForm.patchValue({
              direccionReferencia: partes || resultado.display_name,
            });
          } else {
            this.incidenciaForm.patchValue({
              direccionReferencia: `Ubicación seleccionada (${latRedondeada}, ${lngRedondeada})`,
            });
          }
        },
        error: () => {
          if (seleccion !== this.seleccionActual) return;
          this.buscandoDireccion = false;
          this.incidenciaForm.patchValue({
            direccionReferencia: `Coordenadas: ${latRedondeada}, ${lngRedondeada}`,
          });
        },
      });
  }

  usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.mensajeMapa = 'Tu navegador no admite geolocalización.';
      return;
    }

    this.buscandoDireccion = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.mapa?.setView([coords.latitude, coords.longitude], 17);
        this.seleccionarUbicacion(coords.latitude, coords.longitude);
      },
      () => {
        this.buscandoDireccion = false;
        this.mensajeMapa =
          'No se pudo obtener tu ubicación automática. Haz clic o arrastra el pin en el mapa.';
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  abrirSelectorFotos(): void {
    this.fileInput?.nativeElement.click();
  }

  onArchivosSeleccionados(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.procesarArchivos(Array.from(input.files));
      input.value = '';
    }
  }

  onDropFotos(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.procesarArchivos(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private procesarArchivos(archivos: File[]): void {
    this.errorFotos.set('');
    const actuales = [...this.fotos()];

    for (const file of archivos) {
      if (actuales.length >= 3) {
        this.errorFotos.set('Solo puedes adjuntar un máximo de 3 fotografías.');
        break;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        this.errorFotos.set('Solo se permiten imágenes en formato JPG o PNG.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.errorFotos.set(`La imagen "${file.name}" supera el límite de 5MB.`);
        continue;
      }
      actuales.push({
        file,
        url: URL.createObjectURL(file),
      });
    }

    this.fotos.set(actuales);
  }

  eliminarFoto(index: number): void {
    const actuales = [...this.fotos()];
    URL.revokeObjectURL(actuales[index].url);
    actuales.splice(index, 1);
    this.fotos.set(actuales);
    this.errorFotos.set('');
  }

  mejorarConIA(): void {
    const descripcion = (this.incidenciaForm.value.descripcion ?? '').trim();
    const cat = this.categorias().find(
      (c) => c.idCategoria === Number(this.incidenciaForm.value.idCategoria),
    );

    if (descripcion.length < 10) {
      this.errorIA.set('Escribe al menos 10 caracteres en la descripción para mejorarla con IA.');
      return;
    }

    this.errorIA.set('');
    this.sugerenciaIA.set('');
    this.mejorandoIA.set(true);

    this.iaService
      .mejorarDescripcion({
        descripcion,
        categoria: cat?.nombre,
      })
      .subscribe({
        next: (r) => {
          this.sugerenciaIA.set(r.descripcionMejorada);
          this.mejorandoIA.set(false);
        },
        error: () => {
          this.errorIA.set(
            'No se pudo mejorar el texto. Verifica tu clave de IA o intenta nuevamente.',
          );
          this.mejorandoIA.set(false);
        },
      });
  }

  aceptarSugerencia(): void {
    this.incidenciaForm.patchValue({ descripcion: this.sugerenciaIA() });
    this.sugerenciaIA.set('');
  }

  descartarSugerencia(): void {
    this.sugerenciaIA.set('');
  }

  onSubmit(): void {
    if (this.incidenciaForm.invalid) {
      this.incidenciaForm.markAllAsTouched();
      this.errorEnvio.set(
        'Por favor, selecciona una categoría, una ubicación y completa la descripción.',
      );
      return;
    }

    this.errorEnvio.set('');
    this.enviando.set(true);

    const catSeleccionada = this.categorias().find(
      (c) => c.idCategoria === Number(this.incidenciaForm.value.idCategoria),
    );

    const payload: IncidenciaRegistro = {
      ...this.incidenciaForm.value,
      titulo: catSeleccionada ? `Reporte: ${catSeleccionada.nombre}` : 'Incidencia Ciudadana',
    };

    this.incidenciaService.registrar(payload).subscribe({
      next: (respuestaBackend) => {
        if (!respuestaBackend.categoria && catSeleccionada) {
          respuestaBackend.categoria = catSeleccionada;
        }

        const fotosAdjuntas = this.fotos();
        if (fotosAdjuntas.length > 0 && respuestaBackend.idIncidencia) {
          const peticionesEvidencia = fotosAdjuntas.map((f) =>
            this.evidenciaService.subirArchivo(
              f.file,
              respuestaBackend.idIncidencia,
              'Inicial',
            ),
          );

          forkJoin(peticionesEvidencia).subscribe({
            next: () => {
              this.enviando.set(false);
              this.reporteEnviado.set(respuestaBackend);
            },
            error: () => {
              this.enviando.set(false);
              this.reporteEnviado.set(respuestaBackend);
            },
          });
        } else {
          this.enviando.set(false);
          this.reporteEnviado.set(respuestaBackend);
        }
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorEnvio.set(
          err?.error?.message || 'Ocurrió un error al registrar el reporte. Inténtalo nuevamente.',
        );
      },
    });
  }

  irASeguimiento(): void {
    this.router.navigate(['/mis-incidencias']);
  }

  crearOtroReporte(): void {
    this.fotos().forEach((f) => URL.revokeObjectURL(f.url));
    this.fotos.set([]);
    this.sugerenciaIA.set('');
    this.errorIA.set('');
    this.errorEnvio.set('');
    this.reporteEnviado.set(null);

    this.incidenciaForm.reset({
      titulo: 'Reporte Ciudadano',
      descripcion: '',
      direccionReferencia: '',
      latitud: -12.0914,
      longitud: -77.0182,
      prioridad: 'MEDIA',
      idCategoria: null,
    });

    setTimeout(() => this.inicializarMapa(), 50);
  }

  ngOnDestroy(): void {
    this.seleccionActual++;
    this.fotos().forEach((f) => URL.revokeObjectURL(f.url));
    this.mapa?.remove();
  }
}

