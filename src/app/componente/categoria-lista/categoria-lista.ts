import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Categoria } from '../../model/categoria';
import { CategoriaService } from '../../services/categoria-service';

@Component({
  selector: 'app-categoria-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  styleUrl: './categoria-lista.css',
  templateUrl: './categoria-lista.html',
})
export class CategoriaLista implements OnInit {
  private categoriaService = inject(CategoriaService);
  private fb = inject(FormBuilder);

  categorias = signal<Categoria[]>([]);
  cargando = signal<boolean>(true);
  busqueda = signal<string>('');

  modalFormularioAbierto = signal<boolean>(false);
  editandoId = signal<number | null>(null);
  guardando = signal<boolean>(false);
  errorFormulario = signal<string>('');

  detalleCategoria = signal<Categoria | null>(null);
  cargandoDetalle = signal<boolean>(false);

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
    horasEstimadas: [48, [Validators.required, Validators.min(1)]],
    icono: ['category'],
    estado: [true],
  });

  categoriasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.categorias();
    return this.categorias().filter(
      (c) =>
        (c.nombre || '').toLowerCase().includes(texto) ||
        (c.descripcion || '').toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando.set(true);
    this.categoriaService.listar().subscribe({
      next: (data) => {
        this.categorias.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirCrear(): void {
    this.editandoId.set(null);
    this.errorFormulario.set('');
    this.form.reset({
      nombre: '',
      descripcion: '',
      horasEstimadas: 48,
      icono: 'category',
      estado: true,
    });
    this.modalFormularioAbierto.set(true);
  }

  abrirEditar(cat: Categoria): void {
    this.editandoId.set(cat.idCategoria);
    this.errorFormulario.set('');
    this.form.patchValue({
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      horasEstimadas: cat.horasEstimadas ?? 48,
      icono: cat.icono || 'category',
      estado: cat.estado ?? true,
    });
    this.modalFormularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.modalFormularioAbierto.set(false);
    this.errorFormulario.set('');
  }

  guardarCategoria(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      this.errorFormulario.set('Completa el nombre, descripción y horas SLA.');
      return;
    }

    this.guardando.set(true);
    this.errorFormulario.set('');
    const val = this.form.value;
    const id = this.editandoId();

    const peticion = id
      ? this.categoriaService.actualizar({
          idCategoria: id,
          nombre: val.nombre || '',
          descripcion: val.descripcion || '',
          horasEstimadas: Number(val.horasEstimadas) || 48,
          icono: val.icono || 'category',
          estado: val.estado ?? true,
        })
      : this.categoriaService.registrar({
          nombre: val.nombre || '',
          descripcion: val.descripcion || '',
          horasEstimadas: Number(val.horasEstimadas) || 48,
          icono: val.icono || 'category',
          estado: val.estado ?? true,
        });

    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalFormularioAbierto.set(false);
        this.cargarCategorias();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorFormulario.set(err?.error?.message || 'No se pudo guardar la categoría.');
      },
    });
  }

  verDetalle(cat: Categoria): void {
    this.cargandoDetalle.set(true);
    this.detalleCategoria.set(cat);
    this.categoriaService.buscarPorId(cat.idCategoria).subscribe({
      next: (data) => {
        this.detalleCategoria.set(data);
        this.cargandoDetalle.set(false);
      },
      error: () => this.cargandoDetalle.set(false),
    });
  }
}
