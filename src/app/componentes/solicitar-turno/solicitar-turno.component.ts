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
          }
        
        } else {
          console.error('No se pudo obtener el usuario por email:', user);
        }
      }
    });
  }

async onEspecialidadSeleccionada(especialidad: string) {
  if (!especialidad) return;

  this.especialistas = await this.especialistaService.obtenerEspecialistasPorEspecialidad(especialidad);

  this.turno.uid_especialista = '';
  this.disponibilidades = [];
  this.horariosDisponibles = [];
  this.fechasDisponibles = [];
}

  async onEspecialistaSeleccionado() {
    if (!this.turno.uid_especialista) return;

    this.disponibilidades = await this.authService.obtenerDisponibilidades(this.turno.uid_especialista);
    this.fechasDisponibles = this.generarFechasDisponibles(this.disponibilidades);
  }

  generarFechasDisponibles(disponibilidades: any[]): string[] {
    const hoy = new Date();
    const fechas: string[] = [];

    for (let i = 0; i < 15; i++) {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() + i);

      const diaSemana = dia.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
      const disponible = disponibilidades.find(d => d.dia.toLowerCase() === diaSemana);

      if (disponible) {
        fechas.push(dia.toISOString().split('T')[0]);
      }
    }

    return fechas;
  }

  seleccionarFecha(fecha: string) {
    this.turno.fecha = fecha;
    this.calcularHorarios(fecha);
  }

  calcularHorarios(fecha: string) {
    const diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const disponibilidad = this.disponibilidades.find(d => d.dia.toLowerCase() === diaSemana);

    if (!disponibilidad) return;

    const desde = disponibilidad.desde;
    const hasta = disponibilidad.hasta;
    const duracion = disponibilidad.duracion_turno;

    const [hDesde, mDesde] = desde.split(':').map(Number);
    const [hHasta, mHasta] = hasta.split(':').map(Number);

    const horaInicio = new Date();
    horaInicio.setHours(hDesde, mDesde, 0, 0);

    const horaFin = new Date();
    horaFin.setHours(hHasta, mHasta, 0, 0);

    const horarios: string[] = [];

    while (horaInicio < horaFin) {
      const h = horaInicio.getHours().toString().padStart(2, '0');
      const m = horaInicio.getMinutes().toString().padStart(2, '0');
      horarios.push(`${h}:${m}`);
      horaInicio.setMinutes(horaInicio.getMinutes() + duracion);
    }

    this.horariosDisponibles = horarios;
  }

  seleccionarHora(hora: string) {
    this.turno.hora_inicio = hora;

    const [h, m] = hora.split(':').map(Number);
    const horaFin = new Date();
    horaFin.setHours(h, m + 30); // ajustar según duración real si es variable

    const finH = horaFin.getHours().toString().padStart(2, '0');
    const finM = horaFin.getMinutes().toString().padStart(2, '0');
    this.turno.hora_fin = `${finH}:${finM}`;
  }

  async crearTurno() {
    try {
      if (this.perfil === 'admin' && !this.turno.uid_paciente) {
        Swal.fire('Error', 'Debe seleccionar un paciente', 'error');
        return;
      }

      await this.turnoService.crearTurno(this.turno);
      Swal.fire('Éxito', 'Turno creado correctamente', 'success');

      // Reset
      this.turno.fecha = '';
      this.turno.hora_inicio = '';
      this.turno.hora_fin = '';
      this.fechasDisponibles = [];
      this.horariosDisponibles = [];
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Hubo un problema al crear el turno', 'error');
    }
  }
}
