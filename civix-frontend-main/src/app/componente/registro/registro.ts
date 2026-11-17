import { Component, inject } from '@angular/core';
import { MatCard, MatCardContent, MatCardTitle } from '@angular/material/card';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField, MatHint, MatInput, MatInputModule, MatLabel } from '@angular/material/input';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { UsuarioService } from '../../services/usuario-service';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioRegistro } from '../../model/usuario-registro';
import { MatIcon } from '@angular/material/icon';

@Component({
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,

    MatFormField,
    MatLabel,
    MatInput,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButton,
    ReactiveFormsModule,
    MatIconButton,
    MatIcon,
  ],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  usuarioForm: FormGroup;
  fb: FormBuilder = inject(FormBuilder);
  usuarioService: UsuarioService = inject(UsuarioService);
  router = inject(Router);
  edicion: boolean = false;
  route: ActivatedRoute = inject(ActivatedRoute);
  id: number;
  hide: boolean = true;
  constructor() {
    this.usuarioForm = this.fb.group({
      idUsuario: [''],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      dni: ['', Validators.required],
      telefono: ['', Validators.required],
    });
  }
  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.id = +params['id'];
      console.log('ID recibido', this.id);
      this.edicion = params['id'] != null;
    });
    this.cargaForm();
  }

  private cargaForm() {
    if (this.edicion) {
      this.usuarioService.buscarporId(this.id).subscribe({
        next: (data) => {
          this.usuarioForm.setValue(data);
        },
      });
    }
  }

  protected onSubmit() {
    if (this.usuarioForm.valid) {
      let usuario = new UsuarioRegistro();
      usuario = this.usuarioForm.value;
      if (!this.edicion) {
        console.log('Datos leidos del fomrulario', usuario);
        this.usuarioService.registrar(usuario).subscribe({
          next: (data) => {
            this.router.navigate(['']);
            console.log('Lista Actualizada');
          },
        });
      }
    }
  }
}
