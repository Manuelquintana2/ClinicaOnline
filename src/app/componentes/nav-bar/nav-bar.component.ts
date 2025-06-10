import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLinkActive, RouterLink, CommonModule,SpinnerComponent],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
  cargando = false;
  isLoggedIn: boolean = false;
  private sub!: Subscription;

  constructor(private auth: AuthService, private router: Router) {}

 
  ngOnInit() {
    this.sub = this.auth.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
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
      this.router.navigate(["/home"])
    }, 2000);
  }
}
