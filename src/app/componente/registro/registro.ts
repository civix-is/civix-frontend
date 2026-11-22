import { Component, ElementRef, inject, QueryList, signal, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UsuarioService } from '../../services/usuario-service';
import { UsuarioRegistro } from '../../model/usuario-registro';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  pasoActual = signal<1 | 2>(1);
  hidePassword = signal<boolean>(true);
  enviando = signal<boolean>(false);
  errorPaso1 = signal<string>('');
  errorPaso2 = signal<string>('');
  mensajeReenvio = signal<string>('');

  digitosOtp = signal<string[]>(['', '', '', '', '', '']);

  usuarioForm: FormGroup = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  irAPaso2(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      if (this.usuarioForm.get('dni')?.invalid) {
        this.errorPaso1.set('El DNI debe tener exactamente 8 dígitos.');
      } else if (this.usuarioForm.get('telefono')?.invalid) {
        this.errorPaso1.set('El teléfono debe tener 9 dígitos.');
      } else if (this.usuarioForm.get('correo')?.invalid) {
        this.errorPaso1.set('Ingresa un correo electrónico válido.');
      } else if (this.usuarioForm.get('password')?.invalid) {
        this.errorPaso1.set('La contraseña debe tener al menos 8 caracteres.');
      } else {
        this.errorPaso1.set('Completa todos los campos obligatorios para continuar.');
      }
      return;
    }

    this.errorPaso1.set('');
    this.errorPaso2.set('');
    this.pasoActual.set(2);

    setTimeout(() => {
      this.otpInputs?.first?.nativeElement.focus();
    }, 50);
  }

  volverAPaso1(): void {
    this.errorPaso2.set('');
    this.mensajeReenvio.set('');
    this.pasoActual.set(1);
  }

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value.replace(/\D/g, '').slice(-1);
    input.value = valor;

    const copia = [...this.digitosOtp()];
    copia[index] = valor;
    this.digitosOtp.set(copia);

    if (valor && index < 5) {
      this.otpInputs.toArray()[index + 1]?.nativeElement.focus();
    }
  }

  onOtpKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digitosOtp()[index] && index > 0) {
      this.otpInputs.toArray()[index - 1]?.nativeElement.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const texto = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!texto) return;

    const copia = ['', '', '', '', '', ''];
    texto.split('').forEach((char, idx) => (copia[idx] = char));
    this.digitosOtp.set(copia);

    const inputs = this.otpInputs.toArray();
    copia.forEach((val, idx) => {
      if (inputs[idx]) inputs[idx].nativeElement.value = val;
    });
    const ultimoIdx = Math.min(texto.length, 5);
    inputs[ultimoIdx]?.nativeElement.focus();
  }

  reenviarCodigo(): void {
    this.mensajeReenvio.set('Se ha reenviado un nuevo código de 6 dígitos a tu teléfono.');
    setTimeout(() => this.mensajeReenvio.set(''), 4000);
  }

  finalizarRegistro(): void {
    const codigo = this.digitosOtp().join('');
    if (codigo.length < 6) {
      this.errorPaso2.set('Ingresa los 6 dígitos del código de verificación.');
      return;
    }

    this.errorPaso2.set('');
    this.enviando.set(true);

    const nuevoUsuario: UsuarioRegistro = {
      nombre: this.usuarioForm.value.nombre.trim(),
      apellido: this.usuarioForm.value.apellido.trim(),
      correo: this.usuarioForm.value.correo.trim(),
      password: this.usuarioForm.value.password,
      dni: this.usuarioForm.value.dni.trim(),
      telefono: this.usuarioForm.value.telefono.trim(),
    };

    this.usuarioService.registrar(nuevoUsuario).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorPaso2.set(
          err?.error?.message ||
            'No se pudo completar el registro. Verifica si el correo o DNI ya existen.',
        );
      },
    });
  }
}
