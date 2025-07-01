import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../../servicios/auth.service';
import { TurnoService } from '../../servicios/turno.service';
import { Usuario, Paciente,Especialista,Turno } from '../../interface/users';
import { Modal } from 'bootstrap';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CardEstiloDirective } from '../../directivas/app-card-estilo.directive';

@Component({
  selector: 'app-seccion-pacientes',
  imports: [CommonModule,CardEstiloDirective],
  templateUrl: './seccion-pacientes.component.html',
  styleUrl: './seccion-pacientes.component.css'
})
export class SeccionPacientesComponent {

  pacientesAtendidos: { paciente: Paciente, turnos: Turno[] }[] = [];
  turnosConHistoria: Turno[] = [];
  perfil: string | null = null;
  cargando: boolean = true;
  private sub!: Subscription;
  usuario! : Usuario;

  @ViewChild('modalHistoriasClinicas') modalElement!: ElementRef;
  modalBootstrap!: Modal;

  constructor(private auth: AuthService, private turnoService: TurnoService) {}

  async ngOnInit() {
    this.sub = this.auth.currentUser$.subscribe(async user => {
      console.log('Usuario actual:', user);

      if (user) {
        const data = await this.auth.getUserProfile();
        const usuarioResult = await this.auth.getUsuarioPorEmail(user.email);
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
      this.pacientesAtendidos = await this.turnoService.getPacientesAtendidosPorEspecialista(this.usuario.uid!);
    });
  }

  verHistoria(pacienteTurnos: { paciente: Paciente, turnos: Turno[] }) {
    this.turnosConHistoria = pacienteTurnos.turnos.map(t => ({ ...t, expandir: false }));

    if (!this.modalBootstrap) {
      this.modalBootstrap = new Modal(this.modalElement.nativeElement);
    }
    this.modalBootstrap.show();
  }
}
