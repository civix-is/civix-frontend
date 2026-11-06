import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IncidenciaService } from '../../services/incidencia-service';
import { ActivatedRoute, Router } from '@angular/router';
import { IncidenciaRegistro } from '../../model/incidencia-registro';

// Importaciones de Angular Material necesarias
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-incidencia-crear',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
  ],
  styleUrl: './incidencia-crear.css',
  templateUrl: './incidencia-crear.html',
})
export class IncidenciaCrear implements OnInit {
  incidenciaForm: FormGroup;
  fb: FormBuilder = inject(FormBuilder);
  incidenciaService = inject(IncidenciaService);
  router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);

  edicion: boolean = false;
  id: number = 0;

  constructor() {
    this.incidenciaForm = this.fb.group({
      titulo: ['Incidencia Ciudadana', Validators.required], // Valor por defecto temporal
      descripcion: ['', Validators.required],
      direccionReferencia: ['', Validators.required],
      latitud: [0, Validators.required],
      longitud: [0, Validators.required],
      prioridad: ['Media', Validators.required],
      idCategoria: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.id = params['id'];
      this.edicion = params['id'] != null;
      this.cargaForm();
    });
  }

  cargaForm() {
    if (this.edicion) {
      this.incidenciaService.buscarporId(this.id).subscribe({
        next: (data) => {
          this.incidenciaForm.patchValue(data);
        },
      });
    }
  }

  mejorarConIA() {
    console.log('Simulando mejora con IA...');
    this.incidenciaForm.patchValue({
      descripcion:
        'Se reporta un bache de gran magnitud en el carril central de la Av. Javier Prado, el cual representa un riesgo potencial de colisión vehicular.',
    });
  }

  onSubmit() {
    if (this.incidenciaForm.valid) {
      let incidencia = new IncidenciaRegistro();
      incidencia = { ...this.incidenciaForm.value };

      if (!this.edicion) {
        console.log('Datos leídos del formulario', incidencia);
        this.incidenciaService.registrar(incidencia).subscribe({
          next: (data) => {
            this.router.navigate(['mis-incidencias']);
            console.log('Lista Actualizada');
          },
        });
      }
    }
  }
}

