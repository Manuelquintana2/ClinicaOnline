import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaFormateada'
})
export class FechaFormateadaPipe implements PipeTransform {
  transform(fechaISO: string | Date): string {
      if (!fechaISO) return '';

      const fecha = new Date(fechaISO);
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const anio = fecha.getFullYear();
      const horas = fecha.getHours().toString().padStart(2, '0');
      const minutos = fecha.getMinutes().toString().padStart(2, '0');

      return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
    }
}
