import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLinkActive, RouterLink, CommonModule],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.css'
})
export class NavBarComponent {
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
    await this.auth.signOut();
    this.isLoggedIn = false;
    this.router.navigate(["/home"])
  }
}
