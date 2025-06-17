import { Injectable } from '@angular/core';
import { environment } from '../../enviroment/enviroment';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Turno } from '../interface/users';

@Injectable({
  providedIn: 'root'
})
export class TurnoService {

  private supabase: SupabaseClient;
 
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
  const diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

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
  const diaSemana = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();

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

}
