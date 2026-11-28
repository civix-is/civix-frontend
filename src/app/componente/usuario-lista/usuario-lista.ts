import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Usuario } from '../../model/usuario';
import { UsuarioService } from '../../services/usuario-service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-usuario-lista',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  styleUrl: './usuario-lista.css',
  templateUrl: './usuario-lista.html',
})
export class UsuarioLista implements OnInit {
  private usuarioService = inject(UsuarioService);
  authService = inject(AuthService);

  usuarios = signal<Usuario[]>([]);
  cargando = signal<boolean>(true);
  busqueda = signal<string>('');
  filtroRol = signal<string>('TODOS');

  usuarioBaja = signal<Usuario | null>(null);
  procesandoBaja = signal<boolean>(false);
  errorBaja = signal<string>('');

  usuariosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const rolSeleccionado = this.filtroRol();

    return this.usuarios().filter((u) => {
      const rolUsuario = this.obtenerRol(u);
      const coincideRol = rolSeleccionado === 'TODOS' || rolUsuario === rolSeleccionado;
      if (!coincideRol) return false;

      if (!texto) return true;
      const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.toLowerCase();
      const correo = (u.correo || '').toLowerCase();
      const dni = (u.dni || '').toLowerCase();
      const telefono = (u.telefono || '').toLowerCase();

      return (
        nombreCompleto.includes(texto) ||
        correo.includes(texto) ||
        dni.includes(texto) ||
        telefono.includes(texto)
      );
    });
  });

  ngOnInit(): void {
    this.cargarLista();
  }

  cargarLista(): void {
    this.cargando.set(true);
    this.usuarioService.list().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  obtenerRol(u: Usuario): string {
    const raw = u.rol?.nombreRol || u.idRol?.nombreRol || 'CIUDADANO';
    return raw.replace(/^ROLE_/, '').toUpperCase();
  }

  obtenerIniciales(u: Usuario): string {
    const iniN = u.nombre ? u.nombre.charAt(0).toUpperCase() : '';
    const iniA = u.apellido ? u.apellido.charAt(0).toUpperCase() : '';
    return iniN + iniA || (u.correo ? u.correo.substring(0, 2).toUpperCase() : 'US');
  }

  obtenerFechaRegistro(u: Usuario): Date | string {
    return u.fechaRegistro || u.FechaRegistro;
  }

  solicitarBaja(u: Usuario): void {
    this.errorBaja.set('');
    this.usuarioBaja.set(u);
  }

  confirmarBaja(): void {
    const u = this.usuarioBaja();
    if (!u || this.procesandoBaja()) return;
    this.procesandoBaja.set(true);
    this.errorBaja.set('');

    this.usuarioService.eliminar(u.idUsuario).subscribe({
      next: () => {
        this.procesandoBaja.set(false);
        this.usuarioBaja.set(null);
        this.usuarios.update((lista) =>
          lista.map((item) =>
            item.idUsuario === u.idUsuario ? { ...item, estado: false } : item,
          ),
        );
      },
      error: (err) => {
        this.procesandoBaja.set(false);
        this.errorBaja.set(err?.error?.message || 'No se pudo dar de baja al usuario.');
      },
    });
  }
}

