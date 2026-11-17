import { Component, inject, ViewChild } from '@angular/core';
import { Incidencia } from '../../model/incidencia';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef, MatRow,
  MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { IncidenciaService } from '../../services/incidencia-service';
import { Router } from '@angular/router';

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
export class IncidenciasTodas {
  lista: Incidencia[];
  displayedColumns: string[] = ['titulo', 'descripcion', 'prioridad'];
  dataSource: MatTableDataSource<Incidencia> = new MatTableDataSource<Incidencia>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  incidenciaService: IncidenciaService = inject(IncidenciaService);
  route: Router = inject(Router);
  constructor() {}
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  ngOnInit() {
    console.log('Component ngOnInit llamando al API Get');
    this.cargarLista();
  }
  cargarLista() {
    this.incidenciaService.listar().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource._updateChangeSubscription();
      },
    });
  }
}
