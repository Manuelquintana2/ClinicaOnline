import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

  async onSubmit() {
    try {
      await this.auth.logIn(this.email, this.password);
      this.router.navigate(['/home']); // Redirige al home o dashboard
    } catch (error) {
      alert('Credenciales inválidas');
      console.error(error);
    }
  }

  fillUser(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
