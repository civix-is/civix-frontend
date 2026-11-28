import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { EvidenciaService } from '../../services/evidencia-service';

@Component({
  selector: 'app-evidencia-subida',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule],
  styleUrl: './evidencia-subida.css',
  templateUrl: './evidencia-subida.html',
})
export class EvidenciaSubida implements OnInit {
  private evidenciaService = inject(EvidenciaService);
  private router = inject(Router);

  evidencias = signal<any[]>([]);
  cargando = signal<boolean>(true);
  busqueda = signal<string>('');
  evidenciaAEliminar = signal<any | null>(null);
  eliminando = signal<boolean>(false);

  evidenciasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.evidencias();
    return this.evidencias().filter(
      (e) =>
        String(e.idIncidencia || '').includes(texto) ||
        (e.fase || '').toLowerCase().includes(texto) ||
        (e.urlArchivo || '').toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    this.cargarEvidencias();
  }

  cargarEvidencias(): void {
    this.cargando.set(true);
    this.evidenciaService.listar().subscribe({
      next: (data) => {
        this.evidencias.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  verIncidencia(idIncidencia: number): void {
    if (idIncidencia) {
      this.router.navigate(['/incidencia-detalle', idIncidencia]);
    }
  }

  confirmarEliminar(): void {
    const ev = this.evidenciaAEliminar();
    if (!ev || this.eliminando()) return;
    this.eliminando.set(true);
    this.evidenciaService.eliminar(ev.idEvidencia).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.evidenciaAEliminar.set(null);
        this.evidencias.update((lista) => lista.filter((x) => x.idEvidencia !== ev.idEvidencia));
      },
      error: () => {
        this.eliminando.set(false);
        this.evidenciaAEliminar.set(null);
      },
    });
  }
}
