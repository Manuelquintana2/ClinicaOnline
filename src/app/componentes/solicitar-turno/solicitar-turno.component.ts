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
  estadoActual!: 'seleccionarPaciente' | 'seleccionarEspecialidad' | 'seleccionarEspecialista' | 'seleccionarFecha' | 'seleccionarHorario';

  
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
            this.estadoActual = 'seleccionarPaciente';
          } else {
            this.estadoActual = 'seleccionarEspecialidad';
          }
        } 
      }
    });
  }

  async onEspecialidadSeleccionada(especialidad: string) {
    if (!especialidad) return;

    this.turno.especialidad = especialidad;
    this.especialistas = await this.especialistaService.obtenerEspecialistasPorEspecialidad(especialidad);

    this.estadoActual = 'seleccionarEspecialista';
  }
  onPacienteSeleccionado(paciente: Paciente) {
    this.turno.uid_paciente = paciente.uid!;
     this.estadoActual = 'seleccionarEspecialidad';
  }

  async onEspecialistaSeleccionado() {
    if (!this.turno.uid_especialista || !this.turno.especialidad) return;

    await this.cargarFechasDisponibles();
    this.estadoActual = 'seleccionarFecha';
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

  async onFechaSeleccionada(fechaISO: string) {
    this.turno.fecha = fechaISO;

    this.horariosDisponibles = await this.turnoService.obtenerHorariosDisponibles(
      this.turno.uid_especialista,
      this.turno.especialidad,
      this.turno.fecha
    );
    this.estadoActual = 'seleccionarHorario';
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

    this.estadoActual = this.perfil === 'admin' ? 'seleccionarPaciente' : 'seleccionarEspecialidad';
    this.horariosDisponibles = [];
  }

  private obtenerDiaSemanaSinDesfase(dateString: string): string {
    const dias = ['sábado', 'domingo','lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return dias[date.getDay()];
  }

  private formatearFecha(fecha: Date): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = meses[fecha.getMonth()];
    return `${dia} de ${mes}`;
  }

  async cargarFechasDisponibles(): Promise<void> {
    this.fechasDisponibles = [];

    const { data: disponibilidad } = await this.turnoService.supabase
      .from('disponibilidades')
      .select('dia')
      .eq('uid_especialista', this.turno.uid_especialista)
      .eq('especialidad', this.turno.especialidad);

    const diasDisponibles = disponibilidad?.map(d => d.dia.toLowerCase()) ?? [];

    const hoy = new Date();
    for (let i = 0; i < 15; i++) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() + i);
      const diaNombre = this.obtenerDiaSemanaSinDesfase(fecha.toISOString().split('T')[0]);

      if (diasDisponibles.includes(diaNombre)) {
        const fechaISO = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}`;
        const fechaFormateada = this.formatearFecha(fecha);
        this.fechasDisponibles.push(`${fechaISO}|${fechaFormateada}`);
      }
    }
  }
}
