import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-home',
  imports: [CommonModule,RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  perfil: string | null = null;
  cargando: boolean = true;
  private sub!: Subscription;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(async user => {
      console.log('Usuario actual:', user);

      if (user) {
        const data = await this.authService.getUserProfile();
        this.perfil = data?.perfil ?? null;
      } else {
        // Usuario se deslogueó, limpiar perfil
        this.perfil = null;
      }

      console.log('Perfil cargado:', this.perfil);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
