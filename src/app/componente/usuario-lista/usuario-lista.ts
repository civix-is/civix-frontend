import { Component, inject, ViewChild} from '@angular/core';
import {MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {Usuario} from "../../model/usuario";
import {MatSort} from "@angular/material/sort";
import {Router} from "@angular/router";
import {UsuarioService} from "../../services/usuario-service";

@Component({
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    MatHeaderCellDef,
    MatPaginator,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
  ],
  selector: 'app-usuario-lista',
  styleUrl: './usuario-lista.css',
  templateUrl: './usuario-lista.html',
})
export class UsuarioLista {
  lista : Usuario[];
  displayedColumns: string[] = ['idUsuario', 'nombre', 'correo'];
  dataSource: MatTableDataSource<Usuario> = new MatTableDataSource<Usuario>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  usuarioService: UsuarioService = inject(UsuarioService);
  route : Router = inject(Router);
  constructor() {
  }
  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }
  ngOnInit() {
    console.log('Component ngOnInit llamando al API Get');
    this.cargarLista();
  }
  cargarLista(){
    this.usuarioService.list().subscribe({
      next: data => {
        this.dataSource.data = data;
        this.dataSource._updateChangeSubscription();
      }
    })
  }
}
