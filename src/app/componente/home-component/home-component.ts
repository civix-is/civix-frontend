import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapaInicio') mapaElemento!: ElementRef<HTMLDivElement>;

  private mapa?: L.Map;

  ngAfterViewInit(): void {
    this.iniciarMapa();
  }

  private iniciarMapa(): void {
    const centroLat = -12.0931;
    const centroLng = -77.0465;

    this.mapa = L.map(this.mapaElemento.nativeElement, {
      zoomControl: false,
    }).setView([centroLat, centroLng], 14);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.mapa);

    this.agregarMarcadorMapa(-12.0912, -77.0492, 'Bache Reportado', 'PENDIENTE');
    this.agregarMarcadorMapa(-12.0945, -77.0431, 'Alumbrado apagado', 'EN_PROCESO');
    this.agregarMarcadorMapa(-12.0972, -77.0478, 'Parque Reparado', 'ATENDIDO');
  }

  private agregarMarcadorMapa(lat: number, lng: number, etiqueta: string, estado: string): void {
    if (!this.mapa) return;

    const colorClase =
      estado === 'ATENDIDO' ? 'dot-green' : estado === 'EN_PROCESO' ? 'dot-amber' : 'dot-red';

    const icono = L.divIcon({
      className: 'landing-pin-wrapper',
      html: `
        <div class="landing-pin-badge">
          <span class="pin-dot ${colorClase}"></span>
          <span>${etiqueta}</span>
        </div>
      `,
      iconSize: [165, 32],
      iconAnchor: [82, 16],
    });

    L.marker([lat, lng], { icon: icono }).addTo(this.mapa);
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
  }
}
