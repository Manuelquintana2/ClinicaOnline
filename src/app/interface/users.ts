export interface Usuario {
    uid?: string;
    nombre: string;
    apellido: string;
    edad: number;
    dni: number;
    email: string;
    imagen_perfil: string;
    perfil: 'admin' | 'especialista' | "paciente" 
    lastLogin?: Date;
}
export interface Admin extends Usuario{
}
export interface Especialista extends Usuario{
    especialidades: string[];
    esta_habilitado: boolean;
    horariosDisponibles?: Horarios;
    refToHorariosDisponibles?: string;
}
export interface Paciente extends Usuario{
    obra_social: string;
    imagen_perfil_aux: string; // link al storage
}

export interface Horarios  {
    lunes: string[];
    martes: string[];
    miercoles: string[];
    jueves: string[];
    viernes: string[];
    sabado: string[];
};

export interface Turno  {
  id?: string;
  uid_paciente: string;
  uid_especialista: string;
  especialidad: string;
  fecha: string; // formato 'YYYY-MM-DD'
  hora_inicio: string; // formato 'HH:mm'
  hora_fin: string; // opcional o calculado
  estado?: string; // opcional, default es 'reservado'
  comentario?: string;
  resenia?: string;
  encuesta?: string;
  calificacion?: number;
  historia?: HistoriaDatos;
  nombre_especialista? :string;
  nombre_paciente?:string;
}

export interface HistoriaDatos {
    fijos: {
        altura: number;
        peso: number;
        temperatura: number;
        presion: number;
    };
    dinamicos?: { [key: string]: string };
}
