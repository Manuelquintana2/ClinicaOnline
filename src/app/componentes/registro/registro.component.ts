import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { Especialista,Paciente } from '../../interface/users';
import { AuthService } from '../../servicios/auth.service';
import { v4 as uuidv4 } from 'uuid'; 
import { EspecialidadesService } from '../../servicios/especialidades.service';
import { Subscription } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import {NgxCaptchaModule} from 'ngx-captcha'

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, CommonModule, FormsModule,RouterLink,NgxCaptchaModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent implements OnInit{
  perfil: string | null = null;
  private sub!: Subscription;
  tipoRegistro: 'paciente' | 'especialista' | null = null;

  errorMessage: string | null = null;

  especialistaImagePreview: string | null = null;
  pacienteImage1Preview: string | null = null;
  pacienteImage2Preview: string | null = null;

  pacienteForm: FormGroup;
  especialistaForm: FormGroup;

  especialidades!: string[];

  constructor(private fb: FormBuilder, 
    private auth: AuthService, 
    private especialidadesService: EspecialidadesService,
    private router: Router) {
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
      recaptcha: [null, Validators.required],
    });

    this.especialistaForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(25), Validators.max(80)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      especialidades: [[], Validators.required],
      nuevaEspecialidad:[],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      imagen: [null, Validators.required],
      recaptcha: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.cargarEspecialidades();
    // Cuando cambie el usuario (login/logout), traemos perfil
    this.sub = this.auth.currentUser$.subscribe(async user => {
      if (user) {
        const data = await this.auth.getUserProfile();
        this.perfil = data?.perfil ?? null;
      } else {
        this.perfil = null;
      }
    });
  }
  async cargarEspecialidades() {
    try {
      this.especialidades = await this.especialidadesService.getEspecialidades();
    } catch (err) {
      console.error('Error al cargar especialidades', err);
    }
  }
  
  seleccionar(tipo: 'paciente' | 'especialista') {
    this.tipoRegistro = tipo;
  }

  async agregarEspecialidad() {
    const nueva = this.especialistaForm.get('nuevaEspecialidad')?.value.trim();
    if (nueva && !this.especialidades.includes(nueva)) {
      try {
        await this.especialidadesService.addEspecialidad(nueva);
        await this.cargarEspecialidades();

        const control = this.especialistaForm.get('especialidades');
        const seleccionadas = control?.value || [];
        control?.setValue([...seleccionadas, nueva]);

        this.especialistaForm.get('nuevaEspecialidad')?.reset();
      } catch (error) {
        console.error('Error al agregar especialidad', error);
      }
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
    const { nombre, apellido, edad, dni, obra_social, email, password, imagen1, imagen2 } = this.pacienteForm.value;
    try {
      const { data: authData, error: authError } = await this.auth.register(email, password);

      if (authError || !authData?.user) {
        console.error('Error al registrar usuario en Auth:', authError);
        return;
      }

      const uid = authData.user.id;

      // 2. Subir imagen a storage
      const file = imagen1;
      const file2 = imagen2
      const fileName = `pacientes/${uid}/perfil_${uuidv4()}.jpg`;
      const fileName2 = `pacientes/${uid}/perfilAux_${uuidv4()}.jpg`;

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
          Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Paciente registrado correctamente.',
          confirmButtonColor: '#4193eb',
        });
        console.log('Paciente registrado con éxito:', paciente);
        this.router.navigate(["/login"])
      }

    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);

      switch (message) {
        case 'El correo ya está registrado.':
          this.errorMessage = 'El correo ya está registrado.';
          break;
        default:
          this.errorMessage = 'Ocurrió un error inesperado.';
          console.error(err);
          break;
      }
    }
  }

  async onEspecialistaSubmit() {
    if (this.especialistaForm.invalid) {
      this.especialistaForm.markAllAsTouched();
      return;
    }
    const { nombre, apellido, edad, dni, especialidades, email, password, imagen } = this.especialistaForm.value;
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
        especialidades,
        esta_habilitado: this.perfil === 'admin' ? true : false,
        perfil : "especialista"
      };

      // 4. Insertar en tabla usuarios
      const { error: insertError } = await this.auth.insertUser(especialista);

      if (insertError) {
        console.error('Error al insertar en usuarios:', insertError);
      } else {
          Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Especialista registrado correctamente.',
          confirmButtonColor: '#4193eb',
        });
        console.log('Especialista registrado con éxito:', especialista);
        this.router.navigate(["/login"])
      }

    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);

      switch (message) {
        case 'El correo ya está registrado.':
          this.errorMessage = 'El correo ya está registrado.';
          break;
        default:
          this.errorMessage = 'Ocurrió un error inesperado.';
          console.error(err);
          break;
      }
    }
  }

  onEspecialidadChange(event: Event) {
    const target = event.target as HTMLSelectElement | null;
  }

}
