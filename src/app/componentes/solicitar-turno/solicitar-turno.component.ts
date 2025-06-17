import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Especialista, Paciente, Turno, Usuario } from '../../interface/users';
import Swal from 'sweetalert2';
import { TurnoService } from '../../servicios/turno.service';
import { EspecialidadesService } from '../../servicios/especialidades.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  imports:[CommonModule, FormsModule],
  styleUrls: ['./solicitar-turno.component.css']
})
export class SolicitarTurnoComponent implements OnInit {

  especialidades: string[] = [];
  especialistas: Especialista[] = [];
  pacientes: Paciente[] = [];
  disponibilidades: any[] = [];
  horariosDisponibles: string[] = [];
  usuarioLogueado!: Usuario;
  perfil: string = '';
  private sub!: Subscription;

  fechaMin: string = '';
  fechaMax: string = '';
  mostrarSeleccionPacientes: boolean = false;
  mostrarEspecialidades: boolean = false;
  mostrarEspecialistas: boolean = false;
  
  turno : Turno= {
    especialidad: '',
    uid_especialista: '',
    uid_paciente: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: ''
  };

  fechasDisponibles: string[] = [];

  constructor(private authService: AuthService, private turnoService: TurnoService, private especialistaService : EspecialidadesService) {}

  async ngOnInit() {
    const hoy = new Date();
    this.fechaMin = hoy.toISOString().split('T')[0];

    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + 15);
    this.fechaMax = fechaLimite.toISOString().split('T')[0];

    this.sub = this.authService.currentUser$.subscribe(async user => {
      console.log('Usuario actual:', user);

      if (user) {
        this.especialidades = await this.especialistaService.getEspecialidades()
        const data = await this.authService.getUserProfile();
        const usuarioResult = await this.authService.getUsuarioPorEmail(user.email);
        if (usuarioResult) {
          this.usuarioLogueado = usuarioResult;
          console.log('Usuario obtenido por email:', this.usuarioLogueado);
          this.perfil = this.usuarioLogueado.perfil ?? null;
          
          this.turno.uid_paciente = this.usuarioLogueado.uid!;

          if (this.perfil === 'admin') {
            this.pacientes = await this.turnoService.obtenerPacientes();
            this.mostrarSeleccionPacientes = true;
          } else {
            this.mostrarEspecialidades = true;
          }
        } 
      }
    });
  }

async onEspecialidadSeleccionada(especialidad: string) {
  if (!especialidad) return;

  this.turno.especialidad = especialidad;
  this.especialistas = await this.especialistaService.obtenerEspecialistasPorEspecialidad(especialidad);

  this.mostrarEspecialidades = false;
  this.mostrarEspecialistas = true;
}
  onPacienteSeleccionado(paciente: Paciente) {
    this.turno.uid_paciente = paciente.uid!;
    this.mostrarSeleccionPacientes = false;
    this.mostrarEspecialidades = true;
  }


  async onEspecialistaSeleccionado() {
    if (!this.turno.uid_especialista || !this.turno.especialidad) return;

    // Simulamos la selección de fecha (esto lo vas a mejorar más adelante)
    const fechaHoy = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    this.turno.fecha = fechaHoy;

    this.horariosDisponibles = await this.turnoService.obtenerHorariosDisponibles(
      this.turno.uid_especialista,
      this.turno.especialidad,
      this.turno.fecha
    );
  }
 async seleccionarHorario(hora: string): Promise<void> {
  try {
    this.turno.hora_inicio = hora;

    // Suponiendo que obtuviste duración del turno antes
    const duracion = await this.turnoService.obtenerDuracionTurno(
      this.turno.uid_especialista,
      this.turno.especialidad,
      this.turno.fecha
    );

    if (!duracion) {
      Swal.fire('Error', 'No se pudo calcular la duración del turno', 'error');
      return;
    }

    // Calcular hora_fin
    const [h, m] = hora.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h, m, 0);

    const fin = new Date(inicio.getTime() + duracion * 60000);
    const horaFin = `${fin.getHours().toString().padStart(2, '0')}:${fin.getMinutes().toString().padStart(2, '0')}`;

    this.turno.hora_fin = horaFin;

    // Alta del turno
    await this.turnoService.crearTurno(this.turno);

    Swal.fire('Turno reservado', 'Tu turno fue registrado correctamente.', 'success');
    this.resetTurno(); // si la tenés definida

    return;
  } catch (error) {
    console.error('Error al reservar turno:', error);
    Swal.fire('Error', 'Hubo un problema al registrar el turno', 'error');
    return;
  }
}

  async onFechaSeleccionada() {
    if (!this.turno.fecha || !this.turno.uid_especialista || !this.turno.especialidad) return;

    this.horariosDisponibles = await this.turnoService.obtenerHorariosDisponibles(
      this.turno.uid_especialista,
      this.turno.especialidad,
      this.turno.fecha
    );
  }

  resetTurno() {
    this.turno = {
      especialidad: '',
      uid_especialista: '',
      uid_paciente: this.usuarioLogueado?.uid ?? '',
      fecha: '',
      hora_inicio: '',
      hora_fin: '',
    };

    this.mostrarSeleccionPacientes = this.perfil === 'admin';
    this.mostrarEspecialidades = this.perfil !== 'admin';
    this.mostrarEspecialistas = false;
    this.horariosDisponibles = [];
  }
}
