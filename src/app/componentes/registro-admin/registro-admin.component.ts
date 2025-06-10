import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';
import { AuthService } from '../../servicios/auth.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Admin } from '../../interface/users';

@Component({
  selector: 'app-registro-admin',
  imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterLink],
  templateUrl: './registro-admin.component.html',
  styleUrls: ['./registro-admin.component.css']
})
export class RegistroAdminComponent {
  adminForm: FormGroup;
  adminImagePreview: string | null = null;

  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.adminForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: ['', [Validators.required, Validators.min(18)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      imagen: [null, Validators.required]
    });
  }


  onFileSelect(event: Event, form: FormGroup, controlName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      form.get(controlName)?.setValue(file);
      form.get(controlName)?.markAsTouched();

      const reader = new FileReader();
      reader.onload = () => {
        this.adminImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }


  async onAdminSubmit() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    const { nombre, apellido, edad, dni, email, password, imagen } = this.adminForm.value;

    try {
      const { data: authData, error: authError } = await this.auth.register(email, password);
      if (authError || !authData?.user) {
        console.error('Error al registrar usuario en Auth:', authError);
        return;
      }

      const uid = authData.user.id;
      const fileName = `admins/${uid}/perfil_${uuidv4()}.jpg`;
      const imageUrl = await this.auth.uploadImage(imagen, fileName);

      const admin : Admin = {
        uid,
        nombre,
        apellido,
        edad: +edad,
        dni: +dni,
        email,
        imagen_perfil: imageUrl,
        perfil: 'admin'
      };

      const { error: insertError } = await this.auth.insertUser(admin);
      if (insertError) {
        console.error('Error al insertar en usuarios:', insertError);
      } else {
        Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: 'Administrador registrado correctamente.',
          confirmButtonColor: '#4193eb'
        });
        this.router.navigate(['/home']);
      }
    }catch (err: any) {
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
}
