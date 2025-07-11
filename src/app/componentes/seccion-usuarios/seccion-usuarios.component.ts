import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { Especialista, Paciente, Turno, Usuario } from '../../interface/users';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import { TurnoService } from '../../servicios/turno.service';
import { ElementRef, ViewChild } from '@angular/core';
import { Modal } from 'bootstrap'; // 👈 Asegurate que esté instalada la lib Bootstrap 5
import { CardEstiloDirective } from '../../directivas/app-card-estilo.directive';


@Component({
  selector: 'app-seccion-usuarios',
  imports:[CommonModule, RouterLink,CardEstiloDirective],
  templateUrl: './seccion-usuarios.component.html',
  styleUrls: ['./seccion-usuarios.component.css'],
})
export class SeccionUsuariosComponent implements OnInit {
  @ViewChild('modalHistoriasClinicas') modalElement!: ElementRef;
  modalBootstrap!: Modal;

  turnosConHistoria: Turno[] = [];

  usuarios: Usuario[] = [];
  turnosHistoria: Turno[] = [];
  pacienteSeleccionado?: Paciente;
  mostrarModalHistoria = false;

  constructor(private auth: AuthService, private router: Router, private turnosService : TurnoService) {}

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  async cargarUsuarios() {
    try {
      this.usuarios = await this.auth.getAllUsers();
    } catch (error) {
      console.error('Error al cargar usuarios', error);
    }
  }

  isEspecialista(usuario: Usuario): usuario is Especialista {
    return usuario.perfil === 'especialista' && 'esta_habilitado' in usuario;
  }

  async toggleHabilitacion(usuario: Usuario) {
    if (this.isEspecialista(usuario)) {
      try {
        const nuevoEstado = !usuario.esta_habilitado;
        await this.auth.updateUser(usuario.uid!, { esta_habilitado: nuevoEstado });
        usuario.esta_habilitado = nuevoEstado;
      } catch (err) {
        console.error('Error al cambiar estado del usuario', err);
      }
    }
  }

  irARegistroAdmin() {
    this.router.navigate(['/registrarAdmin']);
  }

  exportarUsuariosExcel() {
  const datosExportar = this.usuarios.map(u => {
    const base = {
      Nombre: u.nombre,
      Apellido: u.apellido,
      Edad: u.edad,
      DNI: u.dni,
      Email: u.email,
      Perfil: u.perfil,
    };

    if (u.perfil === 'paciente') {
      return {
        ...base,
        ObraSocial: (u as Paciente).obra_social
      };
    }

    if (this.isEspecialista(u)) {
      return {
        ...base,
        Especialidades: (u as Especialista).especialidades.join(', '),
        Estado: u.esta_habilitado ? 'Habilitado' : 'Inhabilitado'
      };
    }

    // Admin
    return base;
  });

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExportar);
  const workbook: XLSX.WorkBook = {
    Sheets: { 'Usuarios': worksheet },
    SheetNames: ['Usuarios']
  };
  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, 'usuarios.xlsx');
}

  async verHistoria(usuario: Usuario) {
    if (usuario.perfil !== 'paciente') return;

    const turnos = await this.turnosService.obtenerTurnosFinalizadosConHistoria(usuario.uid!);
    this.turnosConHistoria = turnos.map(t => ({ ...t, expandir: false }));

    // Abrir modal de Bootstrap
    if (this.modalBootstrap) {
      this.modalBootstrap.show();
    } else {
      this.modalBootstrap = new Modal(this.modalElement.nativeElement);
      this.modalBootstrap.show();
    }
  }

  get mostrarAcciones(): boolean {
    return this.usuarios.some(u => u.perfil === 'especialista');
  }
  exportarTurnosPacienteExcel(paciente: any) {
  if (!this.turnosConHistoria || this.turnosConHistoria.length === 0) {
    alert('Este paciente no tiene turnos con historia clínica para exportar.');
    return;
  }

  const data = this.turnosConHistoria.map(turno => {
    const historia = turno.historia_clinica;
    const fijos = historia?.fijos || {};
    const dinamicos = historia?.dinamicos || {};

    const row: any = {
      'Fecha': turno.fecha,
      'Especialista': turno.nombre_especialista,
      'Especialidad': turno.especialidad,
      'Altura (cm)': historia?.fijos?.altura || '',
      'Peso (kg)':  historia?.fijos?.peso || '',
      'Temperatura (°C)':historia?.fijos?.temperatura || '',
      'Presión (mmHg)': historia?.fijos?.presion || '',
    };

    // Agregamos datos dinámicos como columnas adicionales
    Object.keys(dinamicos).forEach(key => {
      row[key] = dinamicos[key];
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = { Sheets: { 'Turnos': worksheet }, SheetNames: ['Turnos'] };
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

  FileSaver.saveAs(blob, `Turnos_${paciente.apellido}_${paciente.nombre}.xlsx`);
}

}
