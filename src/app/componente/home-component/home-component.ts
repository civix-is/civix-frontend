import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    // Redirección automática dependiendo del estado de la sesión
    if (this.authService.estaLogueado()) {
      this.router.navigate(['/mis-incidencias']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
