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
}
