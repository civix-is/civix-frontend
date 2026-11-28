import { AfterViewInit, Component, effect, inject, OnInit, ViewChild } from '@angular/core';
import { Incidencia } from '../../model/incidencia';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { IncidenciaRealtimeService } from '../../services/incidencia-realtime.service';

@Component({
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatPaginator,
    MatRow,
    MatRowDef,
    MatSort,
    MatTable,
    MatHeaderCellDef,
  ],
  selector: 'app-incidencias-todas',
  styleUrl: './incidencias-todas.css',
  templateUrl: './incidencias-todas.html',
})
export class IncidenciasTodas implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'codigoIncidencia',
    'titulo',
    'descripcion',
    'prioridad',
    'estadoAtencion',
  ];
  dataSource: MatTableDataSource<Incidencia> = new MatTableDataSource<Incidencia>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  realtime = inject(IncidenciaRealtimeService);
  route = inject(Router);

  constructor() {
    effect(() => {
      this.dataSource.data = [...this.realtime.incidencias()];
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit() {
    this.realtime.asegurarConexion();
    this.realtime.cargarTodas();
  }

  verDetalle(incidencia: Incidencia): void {
    this.route.navigate(['/incidencia-detalle', incidencia.idIncidencia]);
  }
}
