import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class GraficosService {
  public supabase: SupabaseClient;
   
    constructor() {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    }
  async obtenerTurnos(): Promise<any[]> {
    const { data, error } = await this.supabase.from('turnos').select('*');
    if (error) throw error;
    return data;
  }

  async obtenerLogIngresos(): Promise<any[]> {
    const { data, error } = await this.supabase.from('log_ingresos').select('*');
    if (error) throw error;
    return data;
  }

  async turnosPorEspecialidad(): Promise<{ especialidad: string, cantidad: number }[]> {
    const turnos = await this.obtenerTurnos();
    const resultado: Record<string, number> = {};

    for (const turno of turnos) {
      resultado[turno.especialidad] = (resultado[turno.especialidad] || 0) + 1;
    }

    return Object.entries(resultado).map(([especialidad, cantidad]) => ({ especialidad, cantidad }));
  }

  async turnosPorDia(): Promise<{ fecha: string, cantidad: number }[]> {
    const turnos = await this.obtenerTurnos();
    const resultado: Record<string, number> = {};

    for (const turno of turnos) {
      resultado[turno.fecha] = (resultado[turno.fecha] || 0) + 1;
    }

    return Object.entries(resultado).map(([fecha, cantidad]) => ({ fecha, cantidad }));
  }

 async turnosSolicitadosPorMedico(desde: string, hasta: string): Promise<{ uid_especialista: string, cantidad: number }[]> {
    const { data, error } = await this.supabase
      .from('turnos')
      .select('uid_especialista', { count: 'exact' })
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) throw error;

    // Agrupar cantidad por uid_especialista
    const resultado: Record<string, number> = {};
    data?.forEach(turno => {
      resultado[turno.uid_especialista] = (resultado[turno.uid_especialista] || 0) + 1;
    });

    return Object.entries(resultado).map(([uid_especialista, cantidad]) => ({ uid_especialista, cantidad }));
  }

  // Turnos finalizados por médico en rango de fechas
  async turnosFinalizadosPorMedico(desde: string, hasta: string): Promise<{ uid_especialista: string, cantidad: number }[]> {
    const { data, error } = await this.supabase
      .from('turnos')
      .select('uid_especialista', { count: 'exact' })
      .eq('estado', 'finalizado')
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) throw error;

    // Agrupar cantidad por uid_especialista
    const resultado: Record<string, number> = {};
    data?.forEach(turno => {
      resultado[turno.uid_especialista] = (resultado[turno.uid_especialista] || 0) + 1;
    });

    return Object.entries(resultado).map(([uid_especialista, cantidad]) => ({ uid_especialista, cantidad }));
  }
}
