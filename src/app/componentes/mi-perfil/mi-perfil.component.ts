import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Subscription } from 'rxjs';
import { Especialista, Paciente, Turno, Usuario } from '../../interface/users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TurnoService } from '../../servicios/turno.service';

@Component({
  selector: 'app-mi-perfil',
  imports: [CommonModule,FormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.css'
})
export class MiPerfilComponent {
  turnosConHistoria: Turno[] = [];

  perfil: string | null = null;
  cargando: boolean = true;
  private sub!: Subscription;
  usuario! : Usuario;

  dias: string[] = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  disponibilidades: any[] = [];
  disponibilidad = {
    especialidad: '',
    dia: '',
    desde: '',
    hasta: '',
    duracion_turno: 30
  };

  constructor(private authService: AuthService,private turnosService:TurnoService) {
  }
  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(async user => {
      console.log('Usuario actual:', user);

      if (user) {
        const data = await this.authService.getUserProfile();
        const usuarioResult = await this.authService.getUsuarioPorEmail(user.email);
        if (usuarioResult) {
          this.usuario = usuarioResult;
          console.log('Usuario obtenido por email:', this.usuario);
          this.perfil = this.usuario.perfil ?? null;
        } else {
          console.error('No se pudo obtener el usuario por email:', user);
        }
      } else {
        // Usuario se deslogueó, limpiar perfil
        this.perfil = null;
      }
      if (this.usuario?.uid && this.isEspecialista(this.usuario)) {
        this.disponibilidades = await this.authService.obtenerDisponibilidades(this.usuario.uid);
      }
      else{
        if (this.usuario?.uid && this.isPaciente(this.usuario)) {
          this.turnosConHistoria = await this.turnosService.obtenerTurnosFinalizadosConHistoria(this.usuario.uid);
          this.turnosConHistoria.forEach(t => (t.expandir = false));
        }
      }
      console.log('Perfil cargado:', this.perfil);
    });
  }

    isPaciente(usuario: Usuario): usuario is Paciente {
    return usuario.perfil === 'paciente';
  }

  isEspecialista(usuario: Usuario): usuario is Especialista {
    return usuario.perfil === 'especialista';
  }

  async guardarDisponibilidad() {
    if (!this.usuario?.uid) {
      alert('El UID del especialista no está disponible.');
      return;
    }

    const nueva = {
      uid_especialista: this.usuario.uid,
      ...this.disponibilidad
    };

    try {
      await this.authService.guardarDisponibilidad(nueva);
       Swal.fire({
        icon: 'success',
        title: '¡Registro de disponibilidad exitoso!',
        text: 'Registrado correctamente.',
        confirmButtonColor: '#4193eb',
      });  
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: '¡Algo fallo!',
        text: 'Error',
        confirmButtonColor: 'red',
      });
    }
    this.disponibilidades = await this.authService.obtenerDisponibilidades(this.usuario.uid!);
    this.disponibilidad = {
      especialidad: '',
      dia: '',
      desde: '',
      hasta: '',
      duracion_turno: 30
    };
  }

  async eliminarDisponibilidad(id: number) {
  try {
    await this.authService.eliminarDisponibilidad(id);
    this.disponibilidades = await this.authService.obtenerDisponibilidades(this.usuario.uid!);
    Swal.fire({
      icon: 'success',
      title: 'Disponibilidad eliminada',
      confirmButtonColor: '#4193eb',
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'No se pudo eliminar el horario',
      confirmButtonColor: '#4193eb',
    });
  }
}
}
