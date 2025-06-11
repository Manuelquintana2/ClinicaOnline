import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../enviroment/enviroment';
import { BehaviorSubject } from 'rxjs';
import { Especialista, Usuario } from '../interface/users';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private supabase : SupabaseClient;

  private currentUserSubject = new BehaviorSubject<any | null>(null);

  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
    this.supabase.auth.getUser().then(({ data: { user } }) => {
    this.currentUserSubject.next(user);
    });
    // Y nos suscribimos a cambios de estado de auth
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
   }

  async logIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const message = error.message.toLowerCase();

      if (message.includes('invalid login credentials')) {
        return { success: false, message: 'Email o contraseña incorrectos.' };
      }

      if (message.includes('email not confirmed')) {
        return { success: false, message: 'Debe verificar su correo antes de ingresar.' };
      }

      return { success: false, message: 'Error en la autenticación. Intente nuevamente.' };
    }

    const user = data.user;

    // Por si acaso, chequeo redundante
    if (!user?.email_confirmed_at) {
      this.supabase.auth.signOut()
      return { success: false, message: 'Debe verificar su correo antes de ingresar.' };
    }

    // ⬇️ Verificar perfil del usuario en la base de datos
    const { data: perfilData, error: perfilError } = await this.supabase
      .from('usuarios_clinica')
      .select('perfil, esta_habilitado')
      .eq('uid', user.id)
      .single();

    if (perfilError || !perfilData) {
      return { success: false, message: 'No se pudo obtener el perfil del usuario.' };
    }

    // ⛔ Si es especialista y no está habilitado, denegar acceso
    if (perfilData.perfil === 'especialista' && !perfilData.esta_habilitado) {
      this.supabase.auth.signOut()
      return {
        success: false,
        message: 'El especialista aún no está habilitado para acceder. Espere aprobación del administrador.',
      };
    }

    return { success: true, user };
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

async getCurrentUser() {
  const { data, error } = await this.supabase.auth.getUser();
  return data?.user || null;
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
  async getUserProfile(): Promise<{ perfil: string } | null> {
    // Obtiene la sesión actual directamente de Supabase
    const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) return null;

    const uid = sessionData.session.user.id;

    const { data, error } = await this.supabase
      .from('usuarios_clinica')
      .select('perfil')
      .eq('uid', uid)
      .single();

    return error ? null : data;
  }
  
    async getUsuarioPorEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await this.supabase
      .from('usuarios_clinica')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }

    return data;
  }

  async getAllUsers(): Promise<Usuario[]> {
    const { data, error } = await this.supabase
      .from('usuarios_clinica')
      .select('*');

    if (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }

    return data as Usuario[];
  }

  // ✅ Actualizar un usuario (ej: habilitar especialista)
  async updateUser(uid: string, updates: Partial<Especialista>) {
    const { error } = await this.supabase
      .from('usuarios_clinica')
      .update(updates)
      .eq('uid', uid);

    if (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  async getProfileImageByEmail(email: string): Promise<string | null> {
  const { data, error } = await this.supabase
    .from('usuarios_clinica')
    .select('imagen_perfil')
    .eq('email', email)
    .single();

  if (error || !data?.imagen_perfil) {
    console.error('No se pudo obtener la imagen de perfil:', error);
    return null;
  }

  return data.imagen_perfil;
}

}
