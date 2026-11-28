import { Component, DestroyRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth-service';
import { IncidenciaRealtimeService } from './services/incidencia-realtime.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatBadgeModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  authService = inject(AuthService);
  realtime = inject(IncidenciaRealtimeService);
  router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  nuevosReportes = signal<number>(0);

  // Estado global de Accesibilidad
  mostrarAccesibilidad = signal<boolean>(false);
  altoContraste = signal<boolean>(false);
  escalaTexto = signal<number>(100);
  guiaLectura = signal<boolean>(false);
  reducirMovimiento = signal<boolean>(false);
  posicionGuiaY = signal<number>(220);

  ngOnInit(): void {
    this.sincronizarSesionYRealtime();

    this.router.events
      .pipe(
        filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((evento) => {
        this.sincronizarSesionYRealtime();
        if (evento.urlAfterRedirects.startsWith('/mis-incidencias')) {
          this.nuevosReportes.set(0);
        }
      });

    this.realtime.eventos$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((evento) => {
      if (evento.tipo === 'CREADA' && this.authService.getRol() === 'ADMINISTRADOR') {
        if (!this.router.url.startsWith('/mis-incidencias')) {
          this.nuevosReportes.update((n) => n + 1);
        }

        const titulo = evento.incidencia?.titulo || 'Nueva incidencia registrada';
        const ref = this.snackBar.open(`Nuevo reporte en línea: ${titulo}`, 'Ver reporte', {
          duration: 6000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });

        ref.onAction().subscribe(() => {
          this.nuevosReportes.set(0);
          if (evento.idIncidencia) {
            void this.router.navigate(['/incidencia-detalle', evento.idIncidencia]);
          } else {
            void this.router.navigate(['/mis-incidencias']);
          }
        });
      }
    });
  }

  private sincronizarSesionYRealtime(): void {
    if (this.authService.estaLogueado()) {
      if (!this.authService.nombreUsuario()) {
        this.authService.cargarDatosUsuario();
      }
      this.realtime.asegurarConexion();
    } else {
      this.realtime.detener();
      this.nuevosReportes.set(0);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.guiaLectura()) {
      this.posicionGuiaY.set(event.clientY);
    }
  }

  toggleAccesibilidad(): void {
    this.mostrarAccesibilidad.update((v) => !v);
  }

  cambiarEscalaTexto(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.escalaTexto.set(val);
    document.documentElement.style.fontSize = `${val}%`;
  }

  toggleAltoContraste(activo: boolean): void {
    this.altoContraste.set(activo);
    document.body.classList.toggle('global-high-contrast', activo);
  }

  toggleReducirMovimiento(activo: boolean): void {
    this.reducirMovimiento.set(activo);
    document.body.classList.toggle('global-reduce-motion', activo);
  }

  cerrarSesion(): void {
    this.realtime.detener();
    this.nuevosReportes.set(0);
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
