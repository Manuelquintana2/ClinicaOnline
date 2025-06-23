import { Injectable } from '@angular/core';
import { environment } from '../../enviroment/enviroment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Turno } from '../interface/users';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {

  public supabase: SupabaseClient;
 
  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  async crearTurno(turno: Turno) {
    const { data, error } = await this.supabase
      .from('turnos')
      .insert([{
        ...turno,
        estado: turno.estado ?? 'reservado',
      }]);

    if (error) throw error;
    return data;
  }

  async obtenerPacientes(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('usuarios_clinica')
      .select('*')
      .eq('perfil', 'paciente');

    if (error) throw error;
    return data;
  }

  async obtenerHorariosDisponibles(especialistaUid: string, especialidad: string, fecha: string): Promise<string[]> {
    // 1. Obtener el día de la semana
         const diaSemana = this.obtenerDiaSemanaSinDesfase(fecha);

    // 2. Obtener disponibilidad del especialista para ese día
    const { data: disponibilidad, error: errorDisponibilidad } = await this.supabase
      .from('disponibilidades')
      .select('*')
      .eq('uid_especialista', especialistaUid)
      .eq('especialidad', especialidad)
      .eq('dia', diaSemana)
      .single();

    if (errorDisponibilidad || !disponibilidad) return [];

    const { desde, hasta, duracion_turno } = disponibilidad;

    // 3. Obtener turnos ya reservados para ese especialista y fecha
    const { data: turnosOcupados, error: errorTurnos } = await this.supabase
      .from('turnos')
      .select('hora_inicio')
      .eq('uid_especialista', especialistaUid)
      .eq('fecha', fecha);

    const ocupados = turnosOcupados?.map(t => t.hora_inicio.slice(0, 5)) ?? [];

    // 4. Generar todos los horarios posibles
    const horarios: string[] = [];
    let [h, m] = desde.split(':').map(Number);
    const [hHasta, mHasta] = hasta.split(':').map(Number);

    while (h < hHasta || (h === hHasta && m < mHasta)) {
      const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      if (!ocupados.includes(hora)) horarios.push(hora);

      m += duracion_turno;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
    }

    return horarios;
  }
  async obtenerDuracionTurno(uid_especialista: string, especialidad: string, fecha: string): Promise<number | null> {
     const diaSemana = this.obtenerDiaSemanaSinDesfase(fecha);

    const { data, error } = await this.supabase
      .from('disponibilidades')
      .select('duracion_turno')
      .eq('uid_especialista', uid_especialista)
      .eq('especialidad', especialidad)
      .eq('dia', diaSemana)
      .single();

    if (error || !data) {
      console.error('Error obteniendo duración del turno:', error);
      return null;
    }

    return data.duracion_turno;
  }
  obtenerDiaSemanaSinDesfase(fecha: string): string {
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sabado'];
    const [year, month, day] = fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day); // construye en hora local
    return dias[date.getDay()];
  }

  async obtenerTurnosPaciente(uid: string): Promise<Turno[]> {
    const { data, error } = await this.supabase
      .from('turnos')
      .select(`*, usuarios_clinica!uid_especialista(nombre, apellido)`)
      .eq('uid_paciente', uid);

    if (error) throw error;

    return data.map(t => ({
      ...t,
      nombre_especialista: t.usuarios_clinica?.nombre + ' ' + t.usuarios_clinica?.apellido
    }));
  }
  
  async obtenerTurnosEspecialista(uid: string): Promise<Turno[]> {
    const { data, error } = await this.supabase
    .from('turnos')
    .select(`*, usuarios_clinica!uid_paciente(nombre, apellido)`)
    .eq('uid_especialista', uid);
    
    if (error) throw error;
    
    return data.map(t => ({
      ...t,
      nombre_paciente: t.usuarios_clinica?.nombre + ' ' + t.usuarios_clinica?.apellido
    }));
  }
  async obtenerTodosLosTurnos(): Promise<Turno[]> {
   const { data, error } = await this.supabase
  .from('turnos')
  .select(`
    *,
    usuarios_clinica_paciente:usuarios_clinica!uid_paciente(nombre, apellido, imagen_perfil),
    usuarios_clinica_especialista:usuarios_clinica!uid_especialista(nombre, apellido, imagen_perfil)
  `);

if (error) throw error;

return data.map(t => ({
  ...t,
  nombre_paciente: t.usuarios_clinica_paciente?.nombre + ' ' + t.usuarios_clinica_paciente?.apellido,
  imagen_paciente: t.usuarios_clinica_paciente?.imagen_perfil,
  nombre_especialista: t.usuarios_clinica_especialista?.nombre + ' ' + t.usuarios_clinica_especialista?.apellido,
  imagen_especialista: t.usuarios_clinica_especialista?.imagen_perfil,
}));

  }
  async actualizarEstadoTurno(uid: string, nuevoEstado: string, comentario?: string): Promise<void> {
    if(nuevoEstado === 'finalizado'){
       const { error } = await this.supabase
      .from('turnos')
      .update({ estado: nuevoEstado, resenia: comentario })
      .eq('id', uid);

    if (error) throw error;
    }else{
      const { error } = await this.supabase
        .from('turnos')
        .update({ estado: nuevoEstado, comentario })
        .eq('id', uid);
  
      if (error) throw error;
    }
  }

  async calificarTurno(idTurno: string, calificacion: number) {
    const { error } = await this.supabase
      .from('turnos')
      .update({ calificacion: calificacion })
      .eq('id', idTurno);

    if (error) throw error;
  }

  async guardarEncuesta(idTurno: string, encuesta: string) {
    const { error } = await this.supabase
      .from('turnos')
      .update({ encuesta: encuesta })
      .eq('id', idTurno);

    if (error) throw error;
  }


}
