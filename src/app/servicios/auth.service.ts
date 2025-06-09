import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase : SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
   }

   async logIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) throw error;
    return data;
  }

  async register(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) throw error;
  
    // Detectar intento de registro de un usuario ya existente
    if (data.user && data.user.identities!.length === 0) {
      throw new Error('El correo ya está registrado.');
    }
  
   return { data, error }; 
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }
  
  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }
  
  getClient(): SupabaseClient {
    return this.supabase;
  }

  async uploadImage(file: File, path: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('usuarios') // nombre del bucket
      .upload(path, file, { upsert: true });

    if (error) throw error;

    return `${this.supabase.storage.from('usuarios').getPublicUrl(path).data.publicUrl}`;
  }

  async insertUser(user: any) {
    return await this.supabase.from('usuarios_clinica').insert(user);
  }
}
