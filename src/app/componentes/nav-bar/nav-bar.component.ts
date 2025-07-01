import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Usuario } from '../../interface/users';
import { BordeImagenDirective } from '../../directivas/borde-imagen.directive';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLinkActive, RouterLink, CommonModule,SpinnerComponent, BordeImagenDirective],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  cargando = false;
  isLoggedIn = false;
  usuario: Usuario | null = null;
  private sub!: Subscription;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.sub = this.auth.currentUser$.subscribe(async user => {
      this.isLoggedIn = !!user;
      
      if (user?.email) {
        // Aquí llamás a la función que obtiene el usuario completo por email
        this.usuario = await this.auth.getUsuarioPorEmail(user.email);
      } else {
        this.usuario = null;
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  async cerrarSesion() {
    this.cargando = true;
    setTimeout(() => {
      this.auth.signOut();
      this.cargando = false;
      this.isLoggedIn = false;
      this.usuario = null;
      this.router.navigate(['/home']);
    }, 2000);
  }
}
