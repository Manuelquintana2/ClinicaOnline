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

export type Horarios = {
    lunes: string[];
    martes: string[];
    miercoles: string[];
    jueves: string[];
    viernes: string[];
    sabado: string[];
};

