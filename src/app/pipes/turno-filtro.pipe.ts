import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'turnoFiltro'
})
export class TurnoFiltroPipe implements PipeTransform {

 transform(turnos: any[], filtro: string, perfil: string): any[] {
    if (!filtro || !turnos) return turnos;

    const filtroLower = filtro.toLowerCase();

    return turnos.filter(turno => {
      switch (perfil) {
        case 'paciente':
          return turno.nombre_especialista.toLowerCase().includes(filtroLower) ||
                 turno.especialidad.toLowerCase().includes(filtroLower);
        case 'especialista':
          return turno.nombre_paciente.toLowerCase().includes(filtroLower) ||
                 turno.especialidad.toLowerCase().includes(filtroLower);
        case 'admin':
          return turno.especialidad.toLowerCase().includes(filtroLower) ||
          turno.nombre_especialista.toLowerCase().includes(filtroLower);
        default:
          return true;
      }
    });
  }

}
