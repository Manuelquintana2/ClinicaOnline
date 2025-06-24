import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { Subscription } from 'rxjs';
import { Especialista, Paciente, Turno, Usuario } from '../../interface/users';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { TurnoService } from '../../servicios/turno.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
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

   generarPDFHistoriaClinica(turnos: Turno[], paciente: Paciente) {
    const doc = new jsPDF();
    const logo = new Image();
    logo.src = '/favicon.png';

    const fechaEmision = new Date().toLocaleDateString();

    logo.onload = () => {
      doc.addImage(logo, 'PNG', 10, 10, 20, 20);

      doc.setFontSize(16);
      doc.text('Historia Clínica del Paciente', 105, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Fecha de emisión: ${fechaEmision}`, 200, 10, { align: 'right' });

      // Datos del paciente
      doc.setFontSize(12);
      doc.text(`Nombre: ${paciente.nombre} ${paciente.apellido}`, 10, 40);
      doc.text(`Edad: ${paciente.edad}  -  DNI: ${paciente.dni}`, 10, 47);
      doc.text(`Email: ${paciente.email}`, 10, 54);
      doc.text(`Obra Social: ${paciente.obra_social ?? 'N/A'}`, 10, 61);

      let yOffset = 70;

      turnos.forEach((turno, index) => {
        doc.setFontSize(13);
        doc.text(`Turno ${index + 1}`, 10, yOffset);
        yOffset += 6;

        doc.setFontSize(11);
        doc.text(`Fecha: ${new Date(turno.fecha).toLocaleDateString()}`, 10, yOffset);
        yOffset += 6;
        doc.text(`Especialista: ${turno.nombre_especialista ?? 'Desconocido'}`, 10, yOffset);
        yOffset += 6;
        doc.text(`Especialidad: ${turno.especialidad}`, 10, yOffset);
        yOffset += 8;

        const fijos = turno.historia_clinica?.fijos;
        const dinamicos = turno.historia_clinica?.dinamicos ?? {};

        autoTable(doc, {
          startY: yOffset,
          head: [['Altura', 'Peso', 'Temperatura', 'Presión']],
          body: [[
            fijos?.altura ?? '',
            fijos?.peso ?? '',
            fijos?.temperatura ?? '',
            fijos?.presion ?? ''
          ]]
        });

        yOffset = (doc as any).lastAutoTable.finalY + 4;

        const dinamicoData = Object.entries(dinamicos).map(([key, value]) => [key, value]);

        if (dinamicoData.length > 0) {
          autoTable(doc, {
            startY: yOffset,
            head: [['Campo', 'Valor']],
            body: dinamicoData
          });
          yOffset = (doc as any).lastAutoTable.finalY + 10;
        } else {
          yOffset += 10;
        }
      });

      doc.save(`Historia_Clinica_${paciente.nombre}_${paciente.apellido}.pdf`);
    };
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
