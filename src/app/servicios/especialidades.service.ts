import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {

 private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  async getEspecialidades(): Promise<string[]> {
    const { data, error } = await this.supabase.from('especialidades').select('nombre');

    if (error) throw error;

    return data.map((e: any) => e.nombre);
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
