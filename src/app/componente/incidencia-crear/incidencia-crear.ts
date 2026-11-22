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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidenciaService } from '../../services/incidencia-service';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidenciaRegistro } from '../../model/incidencia-registro';
import { IaService } from '../../services/ia-service';

// Importaciones de Angular Material necesarias
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { CategoriaService } from '../../services/categoria-service';
import { Categoria } from '../../model/categoria';

@Component({
  selector: 'app-incidencia-crear',
  standalone: true,
  imports: [
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
  @ViewChild('mapa') mapaElemento!: ElementRef<HTMLDivElement>;
  incidenciaForm: FormGroup;
  fb: FormBuilder = inject(FormBuilder);
  incidenciaService = inject(IncidenciaService);
  router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);

  edicion: boolean = false;
  id: number = 0;
  private http = inject(HttpClient);
  private mapa?: L.Map;
  private marcador?: L.CircleMarker;
  private seleccionActual = 0;

  iaService = inject(IaService);
  mejorandoIA = signal(false);
  sugerenciaIA = signal('');
  errorIA = signal('');

  categoriaService = inject(CategoriaService);
  categorias = signal<Categoria[]>([]);

  buscandoDireccion = false;
  mensajeMapa = '';
  constructor() {
    this.incidenciaForm = this.fb.group({
      titulo: ['Incidencia Ciudadana', Validators.required], // Valor por defecto temporal
      descripcion: ['', Validators.required],
      direccionReferencia: ['', Validators.required],
      latitud: [null, Validators.required],
      longitud: [null, Validators.required],
      prioridad: ['Media', Validators.required],
      idCategoria: [null, Validators.required],
    });
  }
  ngAfterViewInit(): void {
    this.mapa = L.map(this.mapaElemento.nativeElement).setView([-12.0464, -77.0428], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.mapa);

    this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
      this.seleccionarUbicacion(evento.latlng.lat, evento.latlng.lng);
    });
  }
  seleccionarUbicacion(latitud: number, longitud: number): void {
    if (!this.mapa) return;

    const seleccion = ++this.seleccionActual;

    if (this.marcador) {
      this.marcador.setLatLng([latitud, longitud]);
    } else {
      this.marcador = L.circleMarker([latitud, longitud], {
        radius: 9,
        color: '#1565c0',
        fillColor: '#2196f3',
        fillOpacity: 1,
      }).addTo(this.mapa);
    }

    this.incidenciaForm.patchValue({
      latitud,
      longitud,
      direccionReferencia: '',
    });

    this.buscandoDireccion = true;
    this.mensajeMapa = '';

    this.http
      .get<{ display_name?: string }>('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitud.toString(),
          lon: longitud.toString(),
          format: 'jsonv2',
          'accept-language': 'es',
        },
      })
      .subscribe({
        next: (resultado) => {
          // Evita que una respuesta anterior sobrescriba la última selección.
          if (seleccion !== this.seleccionActual) return;

          this.buscandoDireccion = false;

          if (resultado.display_name) {
            this.incidenciaForm.patchValue({
              direccionReferencia: resultado.display_name,
            });
          } else {
            this.mensajeMapa = 'No se encontró una dirección. Puedes escribir una referencia.';
          }
        },
        error: () => {
          if (seleccion !== this.seleccionActual) return;

          this.buscandoDireccion = false;
          this.mensajeMapa = 'No se pudo consultar la dirección. Puedes escribir una referencia.';
        },
      });
  }

  usarMiUbicacion(): void {
    if (!navigator.geolocation) {
      this.mensajeMapa = 'Tu navegador no admite geolocalización.';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.mapa?.setView([coords.latitude, coords.longitude], 17);
        this.seleccionarUbicacion(coords.latitude, coords.longitude);
      },
      () => {
        this.mensajeMapa = 'No se pudo obtener tu ubicación. Selecciónala en el mapa.';
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  ngOnDestroy(): void {
    this.seleccionActual++;
    this.mapa?.remove();
  }
  ngOnInit() {
    this.categoriaService.listar().subscribe({
      next: (data) => this.categorias.set(data.filter((c) => c.estado)),
    });
    this.route.params.subscribe((params) => {
      this.id = params['id'];
      this.edicion = params['id'] != null;
      this.cargaForm();
    });
  }

  cargaForm() {
    if (this.edicion) {
      this.incidenciaService.buscarporId(this.id).subscribe({
        next: (data) => {
          this.incidenciaForm.patchValue(data);
        },
      });
    }
  }

  mejorarConIA() {
    const descripcion = (this.incidenciaForm.value.descripcion ?? '').trim();
    const cat = this.categorias().find(
      (c) => c.idCategoria === Number(this.incidenciaForm.value.idCategoria),
    );

    if (descripcion.length < 10) {
      this.errorIA.set('Escribe al menos una breve descripción para poder mejorarla.');
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
          this.errorIA.set('No se pudo mejorar el texto. Intenta nuevamente.');
          this.mejorandoIA.set(false);
        },
      });
  }

  aceptarSugerencia() {
    this.incidenciaForm.patchValue({ descripcion: this.sugerenciaIA() });
    this.sugerenciaIA.set('');
  }

  descartarSugerencia() {
    this.sugerenciaIA.set('');
  }

  onSubmit() {
    if (this.incidenciaForm.valid) {
      let incidencia = new IncidenciaRegistro();
      incidencia = { ...this.incidenciaForm.value };

      if (!this.edicion) {
        console.log('Datos leídos del formulario', incidencia);
        this.incidenciaService.registrar(incidencia).subscribe({
          next: (data) => {
            this.router.navigate(['mis-incidencias']);
            console.log('Lista Actualizada');
          },
        });
      }
    }
  }
}

