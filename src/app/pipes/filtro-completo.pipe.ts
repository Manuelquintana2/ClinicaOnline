import { Pipe, PipeTransform } from '@angular/core';
import { Turno } from '../interface/users';

@Pipe({
  name: 'filtroCompleto'
})
export class FiltroCompletoPipe implements PipeTransform {
  transform(turnos: Turno[], filtro: string, perfil: string): Turno[] {
    if (!filtro || !turnos) return turnos;

    const filtroLower = filtro.toLowerCase();

    return turnos.filter(turno => {
      const campos = [
        turno.nombre_especialista,
        turno.nombre_paciente,
        turno.especialidad,
        turno.comentario,
        turno.resenia,
        turno.encuesta,
        turno.estado,
        turno.fecha,
        turno.hora_inicio,
        turno.hora_fin
      ];

      // Campos fijos historia clínica
      if (turno.historia_clinica?.fijos) {
        const { altura, peso, temperatura, presion } = turno.historia_clinica.fijos;
        campos.push(
          altura?.toString(),
          peso?.toString(),
          temperatura?.toString(),
          presion?.toString()
        );
      }

      // Campos dinámicos historia clínica
      if (turno.historia_clinica?.dinamicos) {
        for (const [clave, valor] of Object.entries(turno.historia_clinica.dinamicos)) {
          campos.push(clave, valor);
        }
      }

      return campos.some(campo =>
        campo?.toString().toLowerCase().includes(filtroLower)
      );
    });
  }

}
