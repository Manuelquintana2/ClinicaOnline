import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { Especialista, Usuario } from '../../interface/users';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-seccion-usuarios',
  imports:[CommonModule, RouterLink],
  templateUrl: './seccion-usuarios.component.html',
  styleUrls: ['./seccion-usuarios.component.css'],
})
export class SeccionUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private auth: AuthService, private router: Router) {}

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
    const datosExportar = this.usuarios.map(u => ({
      Nombre: u.nombre,
      Apellido: u.apellido,
      Email: u.email,
      Perfil: u.perfil,
      Estado: this.isEspecialista(u) ? (u.esta_habilitado ? 'Habilitado' : 'Inhabilitado') : 'N/A'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExportar);
    const workbook: XLSX.WorkBook = { Sheets: { 'Usuarios': worksheet }, SheetNames: ['Usuarios'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, 'usuarios.xlsx');
  }

  get mostrarAcciones(): boolean {
    return this.usuarios.some(u => u.perfil === 'especialista');
  }
}
