import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink,SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  cargando = false;

  constructor(private auth: AuthService, private router: Router) {}

  errorMessage: string | null = null;

  async onSubmit() {
    this.errorMessage = null;
    try {
      const result = await this.auth.logIn(this.email, this.password);

      if (!result.success) {
        console.log(result.message)
        // Manejar errores según el mensaje o código que venga
        switch (result.message) {
          case 'Email o contraseña incorrectos.':
            this.errorMessage = 'Email o contraseña incorrectos.';
            break;
          case 'Debe verificar su correo antes de ingresar.':
            this.errorMessage = 'Debe verificar su correo antes de ingresar.';
            break;
          case 'No se pudo obtener el perfil del usuario.':
            this.errorMessage = 'No se pudo obtener el perfil del usuario.';
            break;
          case 'El especialista aún no está habilitado para acceder. Espere aprobación del administrador.':
            this.errorMessage = 'El especialista aún no está habilitado para acceder. Espere aprobación del administrador.';
            break;
          default:
            this.errorMessage = 'Error desconocido, intenta nuevamente.';
            break;
        }
        return;
      }
      this.cargando = true;
      // Login exitoso, redirigir
      setTimeout(()=>{
        this.cargando = false;
        this.router.navigate(['/home']);
      },2000)
    } catch (error) {
      console.error(error);
      this.errorMessage = 'Error inesperado. Intenta más tarde.';
    }
  }


  fillUser(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
