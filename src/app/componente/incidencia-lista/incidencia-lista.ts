import { Component, inject, ViewChild } from '@angular/core';
import { HistorialIncidencia } from '../../model/historial-incidencia';
import { MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow, MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { IncidenciaService } from '../../services/incidencia-service';
import { Incidencia } from '../../model/incidencia';


@Component({
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatHeaderCellDef,
    MatCellDef,
    MatSort,
    MatPaginator,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
  ],
  selector: 'app-incidencia-lista',
  styleUrl: './incidencia-lista.css',
  templateUrl: './incidencia-lista.html',
})
export class IncidenciaLista {
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
    this.incidenciaService.listarMisIncidencias().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource._updateChangeSubscription();
      },
    });
  }
}
