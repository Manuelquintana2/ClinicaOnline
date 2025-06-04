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

   async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) throw error;
    return data;
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
}
