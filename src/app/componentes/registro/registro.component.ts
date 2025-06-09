import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Especialista,Paciente } from '../../interface/users';
import { AuthService } from '../../servicios/auth.service';
import { v4 as uuidv4 } from 'uuid'; 
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
  tipoRegistro: 'paciente' | 'especialista' | null = null;

  especialistaImagePreview: string | null = null;
  pacienteImage1Preview: string | null = null;
  pacienteImage2Preview: string | null = null;

  pacienteForm: FormGroup;
  especialistaForm: FormGroup;

  especialidades: string[] = ['Cardiología', 'Dermatología', 'Pediatría'];
  nuevaEspecialidad: string = '';
  mostrarInputEspecialidad: boolean = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.pacienteForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(0)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      obra_social: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      imagen1: [null, Validators.required],
      imagen2: [null, Validators.required],
    });

    this.especialistaForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(25), Validators.max(80)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      especialidad: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      imagen: [null, Validators.required],
    });
  }

  seleccionar(tipo: 'paciente' | 'especialista') {
    this.tipoRegistro = tipo;
  }

  agregarEspecialidad() {
    if (this.nuevaEspecialidad.trim()) {
      this.especialidades.push(this.nuevaEspecialidad.trim());
      this.especialistaForm.get('especialidad')?.setValue(this.nuevaEspecialidad.trim());
      this.nuevaEspecialidad = '';
      this.mostrarInputEspecialidad = false;
    }
  }

  onFileSelect(event: Event, form: FormGroup, controlName: string) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      form.patchValue({ [controlName]: file });
      form.get(controlName)?.markAsTouched();

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (controlName === 'imagen') {
          this.especialistaImagePreview = result;
        } else if (controlName === 'imagen1') {
          this.pacienteImage1Preview = result;
        } else if (controlName === 'imagen2') {
          this.pacienteImage2Preview = result;
        }
      };
      reader.readAsDataURL(file);
    }
  }


  async onPacienteSubmit() {
   if (this.pacienteForm.invalid) {
      this.pacienteForm.markAllAsTouched();
      return;
    }
    const { nombre, apellido, edad, dni, obra_social, email, password, imagen, imagen2 } = this.pacienteForm.value;
    try {
      const { data: authData, error: authError } = await this.auth.register(email, password);

      if (authError || !authData?.user) {
        console.error('Error al registrar usuario en Auth:', authError);
        return;
      }

      const uid = authData.user.id;

      // 2. Subir imagen a storage
      const file = imagen;
      const file2 = imagen2
      const fileName = `pacientes/${uid}/perfil_${uuidv4()}.jpg`;
      const fileName2 = `pacientes/${uid}/perfil_${uuidv4()}.jpg`;

      const imageUrl1 = await this.auth.uploadImage(file, fileName);
      const imageUrl2 = await this.auth.uploadImage(file2, fileName2);
      // 3. Crear objeto Especialista
      const paciente: Paciente = {
        uid,
        nombre,
        apellido,
        edad: +edad,
        dni: +dni,
        email,
        obra_social,
        imagen_perfil: imageUrl1,
        imagen_perfil_aux: imageUrl2, 
        perfil : "paciente"
      };

      // 4. Insertar en tabla usuarios
      const { error: insertError } = await this.auth.insertUser(paciente);

      if (insertError) {
        console.error('Error al insertar en usuarios:', insertError);
      } else {
        console.log('Paciente registrado con éxito:', paciente);
      }

    } catch (err) {
      console.error('Error inesperado:', err);
    }
  }

  async onEspecialistaSubmit() {
    if (this.especialistaForm.invalid) {
      this.especialistaForm.markAllAsTouched();
      return;
    }
    const { nombre, apellido, edad, dni, especialidad, email, password, imagen } = this.especialistaForm.value;
    try {
      const { data: authData, error: authError } = await this.auth.register(email, password);

      if (authError || !authData?.user) {
        console.error('Error al registrar usuario en Auth:', authError);
        return;
      }

      const uid = authData.user.id;

      // 2. Subir imagen a storage
      const file = imagen;
      const fileName = `especialistas/${uid}/perfil_${uuidv4()}.jpg`;

      const imageUrl = await this.auth.uploadImage(file, fileName);

      // 3. Crear objeto Especialista
      const especialista: Especialista = {
        uid,
        nombre,
        apellido,
        edad: +edad,
        dni: +dni,
        email,
        imagen_perfil: imageUrl,
        especialidades: [especialidad],
        esta_habilitado: false, // Default
        perfil : "especialista"
      };

      // 4. Insertar en tabla usuarios
      const { error: insertError } = await this.auth.insertUser(especialista);

      if (insertError) {
        console.error('Error al insertar en usuarios:', insertError);
      } else {
        console.log('Especialista registrado con éxito:', especialista);
      }

    } catch (err) {
      console.error('Error inesperado:', err);
    }
  }

  onEspecialidadChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
    this.mostrarInputEspecialidad = target?.value === 'otra';
    if (!this.mostrarInputEspecialidad) {
      this.especialistaForm.get('especialidad')?.setValue(target?.value);
    }
  }

}
