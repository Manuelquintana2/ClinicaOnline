import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { SpinnerComponent } from '../spinner/spinner.component';

type Usuario = {
  email: string;
  password: string;
  imagen_perfil: string | null;
};

type GrupoUsuarios = {
  tipo: 'admin' | 'especialista' | 'paciente';
  icono: string;
  expanded: boolean;
  usuarios: Usuario[];
};

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink, SpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  cargando = false;
  errorMessage: string | null = null;

  gruposUsuarios: GrupoUsuarios[] = [
    {
      tipo: 'admin',
      icono: 'bi bi-person-fill-lock',
      expanded: false,
      usuarios: [
        { email: 'sadokik292@jio1.com', password: '123456', imagen_perfil: null }
      ]
    },
    {
      tipo: 'especialista',
      icono: 'bi bi-clipboard2-pulse',
      expanded: false,
      usuarios: [
        { email: 'venamo1190@jio1.com', password: '123456', imagen_perfil: null },
        { email: 'dohog35877@lewou.com', password: '123456', imagen_perfil: null }
      ]
    },
    {
      tipo: 'paciente',
      icono: 'bi-person-circle',
      expanded: false,
      usuarios: [
        { email: 'yepacef747@jio1.com', password: '123456', imagen_perfil: null },
        { email: 'mogoliw132@jio1.com', password: '123456', imagen_perfil: null },
        { email: 'kesexo5727@lewou.com', password: '123456', imagen_perfil: null }
      ]
    }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadProfileImages();
  }

  async loadProfileImages() {
    for (const grupo of this.gruposUsuarios) {
      for (const user of grupo.usuarios) {
        user.imagen_perfil = await this.auth.getProfileImageByEmail(user.email);
      }
    }
  }

  fillUser(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  toggleGrupo(grupo: GrupoUsuarios) {
    grupo.expanded = !grupo.expanded;
  }

  async onSubmit() {
    this.errorMessage = null;
    try {
      const result = await this.auth.logIn(this.email, this.password);

      if (!result.success) {
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
      setTimeout(() => {
        this.cargando = false;
        this.router.navigate(['/home']);
      }, 2000);
    } catch (error) {
      console.error(error);
      this.errorMessage = 'Error inesperado. Intenta más tarde.';
    }
  }
}
