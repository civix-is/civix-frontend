import { Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
import {MatPaginator, PageEvent } from "@angular/material/paginator";
import {Usuario} from "../../model/usuario";
import {UsuarioService} from "../../services/usuario-service";
import { MatIcon } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  imports: [MatPaginator, MatIcon],
  selector: 'app-usuario-lista',
  styleUrl: './usuario-lista.css',
  templateUrl: './usuario-lista.html',
})
export class UsuarioLista implements OnInit {
  private readonly usuarioService = inject(UsuarioService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  errorCarga = signal(false);
  eliminando = signal(false);
  mensajeError = signal('');
  confirmacion = signal('');
  busqueda = signal('');
  indicePagina = signal(0);
  tamanoPagina = signal(5);

  usuariosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const usuarios = this.usuarios();

    if (!texto) return usuarios;

    if (/^\d+$/.test(texto)) {
      return usuarios.filter(
        (usuario) =>
          String(usuario.idUsuario) === texto ||
          usuario.dni?.trim() === texto ||
          usuario.telefono?.trim() === texto,
      );
    }

    return usuarios.filter((usuario) =>
      [this.nombreCompleto(usuario), usuario.correo].some((valor) =>
        (valor ?? '').toLowerCase().includes(texto),
      ),
    );
  });

  usuariosPagina = computed(() => {
    const inicio = this.indicePagina() * this.tamanoPagina();
    return this.usuariosFiltrados().slice(inicio, inicio + this.tamanoPagina());
  });

  ngOnInit(): void {
    this.usuarioService
      .list()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (usuarios) => this.usuarios.set(usuarios),
        error: () => this.errorCarga.set(true),
      });
  }

  nombreCompleto(usuario: Usuario): string {
    return [usuario.nombre, usuario.apellido].filter(Boolean).join(' ');
  }

  buscar(texto: string): void {
    this.busqueda.set(texto);
    this.indicePagina.set(0);
  }

  cambiarPagina(evento: PageEvent): void {
    this.indicePagina.set(evento.pageIndex);
    this.tamanoPagina.set(evento.pageSize);
  }

  eliminar(usuario: Usuario): void {
    if (this.eliminando()) return;

    const nombre = this.nombreCompleto(usuario) || `el usuario ${usuario.idUsuario}`;
    if (!window.confirm(`¿Quieres eliminar a ${nombre}?`)) return;

    this.mensajeError.set('');
    this.confirmacion.set('');
    this.eliminando.set(true);

    this.usuarioService
      .eliminar(usuario.idUsuario)
      .pipe(finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: () => {
          this.usuarios.update((usuarios) =>
            usuarios.filter((item) => item.idUsuario !== usuario.idUsuario),
          );

          const totalPaginas = Math.ceil(this.usuariosFiltrados().length / this.tamanoPagina());
          const ultimaPagina = Math.max(0, totalPaginas - 1);
          this.indicePagina.update((indice) => Math.min(indice, ultimaPagina));
          this.confirmacion.set('Usuario eliminado.');
        },
        error: (error: HttpErrorResponse) => {
          this.mensajeError.set(error.error?.message || 'No se pudo eliminar el usuario.');
        },
      });
  }
}

