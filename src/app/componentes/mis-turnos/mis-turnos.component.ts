import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { TurnoService } from '../../servicios/turno.service'; // Asegurate de que la ruta sea correcta
import { Turno } from '../../interface/users'; // Si tenés un modelo
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-mis-turnos',
  imports: [CommonModule,RouterLink,FormsModule],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.css'
})
export class MisTurnosComponent {
  perfil: string | null = null;
  cargando: boolean = true;
  private sub!: Subscription;
  turnos: Turno[] = [];
  uidUsuario: string | null = null;
    // Modal control
  turnoSeleccionado: Turno | null = null;
  motivo: string = '';
  modalAccion: 'cancelar' | 'rechazar' | 'finalizar' | null = null;
  calificacionSeleccionada: number | null = null;
  encuestaTexto: string = '';
  tipoModalExtra: 'calificacion' | 'encuesta' | null = null;
  mostrarModal: boolean = false;
  contenidoModal: string = '';
  tituloModal: string = '';

  constructor(
  private authService: AuthService,
  private turnoService: TurnoService
) {}

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(async user => {
      if (user) {
        const data = await this.authService.getUserProfile();
        this.perfil = data?.perfil ?? null;
        this.uidUsuario = user.id;

        if (this.perfil === 'paciente') {
          this.turnos = await this.turnoService.obtenerTurnosPaciente(this.uidUsuario!);
        } else if (this.perfil === 'especialista') {
          this.turnos = await this.turnoService.obtenerTurnosEspecialista(this.uidUsuario!);
        } else if (this.perfil === 'admin') {
          this.turnos = await this.turnoService.obtenerTodosLosTurnos();
        }
      } else {
        this.perfil = null;
        this.turnos = [];
      }

      this.cargando = false;
    });
  }


  cancelarTurno(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.modalAccion = 'cancelar';
    this.motivo = '';
    this.abrirModal();
  }

  rechazarTurno(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.modalAccion = 'rechazar';
    this.motivo = '';
    this.abrirModal();
  }

  confirmarMotivo() {
    if (!this.turnoSeleccionado || !this.modalAccion) return;

    let nuevoEstado = '';
    let comentario = this.motivo;

    switch (this.modalAccion) {
      case 'cancelar':
        nuevoEstado = 'cancelado';
        break;
      case 'rechazar':
        nuevoEstado = 'rechazado';
        break;
      case 'finalizar':
        nuevoEstado = 'finalizado';
        break;
    }

    this.turnoService
      .actualizarEstadoTurno(this.turnoSeleccionado.id!, nuevoEstado, comentario)
      .then(() => {
        this.turnoSeleccionado!.estado = nuevoEstado;
        if (nuevoEstado === 'finalizado') {
          this.turnoSeleccionado!.resenia = comentario;
        } else {
          this.turnoSeleccionado!.comentario = comentario;
        }
        this.cerrarModal();
      })
      .catch((err) => {
        console.error('Error al actualizar el turno:', err);
      });
  }

  abrirModal() {
    const modal = new bootstrap.Modal(document.getElementById('motivoModal')!);
    modal.show();
  }

  cerrarModal() {
    const modalElement = document.getElementById('motivoModal');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  }
  cerrarModalComentarioRese() {
  this.mostrarModal = false;
  this.contenidoModal = '';
  this.tituloModal = '';
}

  async aceptarTurno(turno: Turno) {
    try {
      await this.turnoService.actualizarEstadoTurno(turno.id!, 'aceptado');
      turno.estado = 'aceptado'; // Actualiza localmente
    } catch (error) {
      console.error('Error al aceptar el turno:', error);
    }
  }
  finalizarTurno(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.modalAccion = 'finalizar';
    this.motivo = '';
    this.abrirModal();
  }
  calificarTurno(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.tipoModalExtra = 'calificacion';
    this.calificacionSeleccionada = null;
    this.abrirModalExtra();
  }

  completarEncuesta(turno: Turno) {
    this.turnoSeleccionado = turno;
    this.tipoModalExtra = 'encuesta';
    this.encuestaTexto = '';
    this.abrirModalExtra();
  }

  abrirModalExtra() {
    const modal = new bootstrap.Modal(document.getElementById('modalExtra')!);
    modal.show();
  }

  async confirmarCalificacion() {
    if (!this.turnoSeleccionado || !this.calificacionSeleccionada) return;

    try {
      await this.turnoService.calificarTurno(this.turnoSeleccionado.id!, this.calificacionSeleccionada);
      this.turnoSeleccionado.calificacion = this.calificacionSeleccionada;
      this.cerrarModalExtra();
    } catch (error) {
      console.error('Error al calificar el turno:', error);
    }
  }

  async confirmarEncuesta() {
    if (!this.turnoSeleccionado || !this.encuestaTexto.trim()) return;

    try {
      await this.turnoService.guardarEncuesta(this.turnoSeleccionado.id!, this.encuestaTexto);
      this.turnoSeleccionado.encuesta = this.encuestaTexto;
      this.cerrarModalExtra();
    } catch (error) {
      console.error('Error al guardar la encuesta:', error);
    }
  }


  cerrarModalExtra() {
    const modalElement = document.getElementById('modalExtra');
    if (modalElement) {
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance?.hide();
    }
  }

  verResenia(turno: Turno) {
    this.tituloModal = 'Reseña';
    this.contenidoModal = turno.resenia || 'Sin reseña disponible';
    this.mostrarModal = true;
  }

  verComentario(turno: Turno) {
    this.tituloModal = 'Comentario';
    this.contenidoModal = turno.comentario || 'Sin comentario disponible';
    this.mostrarModal = true;
  }
  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
