import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth-service';
import { UsuarioService } from '../../services/usuario-service';
import { IncidenciaRealtimeService } from '../../services/incidencia-realtime.service';
import { Usuario } from '../../model/usuario';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class PerfilComponent implements OnInit {
  authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private realtime = inject(IncidenciaRealtimeService);

  perfil = signal<Usuario | null>(null);
  cargando = signal<boolean>(true);
  error = signal<string>('');

  totalMisReportes = computed(() => this.realtime.misIncidencias().length);
  resueltos = computed(
    () => this.realtime.misIncidencias().filter((i) => i.estadoAtencion === 'ATENDIDO').length,
  );
  pendientes = computed(
    () =>
      this.realtime
        .misIncidencias()
        .filter((i) => i.estadoAtencion === 'PENDIENTE' || i.estadoAtencion === 'EN_PROCESO')
        .length,
  );

  ngOnInit(): void {
    this.realtime.asegurarConexion();
    this.realtime.cargarMisIncidencias();

    const id = this.authService.idUsuario();
    if (id) {
      this.cargarPorId(id);
    } else {
      const correo = this.authService.getCorreo();
      if (!correo) {
        this.cargando.set(false);
        this.error.set('No se pudo identificar la sesión actual.');
        return;
      }
      this.usuarioService.buscarporCorreo(correo).subscribe({
        next: (u) => {
          this.perfil.set(u);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudo cargar la información del perfil.');
        },
      });
    }
  }

  private cargarPorId(id: number): void {
    this.usuarioService.buscarporId(id).subscribe({
      next: (u) => {
        this.perfil.set(u);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No se pudo consultar el perfil.');
      },
    });
  }

  obtenerRol(u: Usuario): string {
    const raw = u.rol?.nombreRol || u.idRol?.nombreRol || this.authService.getRol() || 'CIUDADANO';
    return raw.replace(/^ROLE_/, '');
  }
}
