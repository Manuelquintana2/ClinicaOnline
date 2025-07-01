import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../enviroment/enviroment';
import { Especialidad } from '../interface/users';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {

 private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

async getEspecialidades(): Promise<Especialidad[]> {
  const { data, error } = await this.supabase
    .from('especialidades')
    .select('*');

  if (error) throw error;

  return data as Especialidad[];
}

  async addEspecialidad(nombre: string): Promise<void> {
    const { error } = await this.supabase.from('especialidades').insert([{ nombre }]);
    if (error) throw error;
  }

  async obtenerEspecialistas(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('usuarios_clinica')
      .select('*')
      .eq('perfil', 'especialista');

    if (error) throw error;
    return data;
  }
 async obtenerEspecialistasPorEspecialidad(especialidad: string): Promise<any[]> {
  const { data, error } = await this.supabase
    .from('usuarios_clinica')
    .select('*')
    .contains('especialidades', [especialidad]) // usa array aquí
    .eq('perfil', 'especialista'); // aseguramos que sea especialista

  if (error) throw error;
  return data;
}

}
