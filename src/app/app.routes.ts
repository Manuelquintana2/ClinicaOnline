import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component'
import { SeccionUsuariosComponent } from './componentes/seccion-usuarios/seccion-usuarios.component';
import { RegistroAdminComponent } from './componentes/registro-admin/registro-admin.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    {path:"home", component: HomeComponent},
    {path:"login", component: LoginComponent},
    {path:"registro", component: RegistroComponent},
    {path:"admin/seccion-usuarios", component: SeccionUsuariosComponent},
    {path:"admin/registro-admin", component: RegistroAdminComponent},
    {path: 'mi-perfil', loadComponent: () => import('./componentes/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent) },
    {path: 'solicitar-turno', loadComponent: () => import('./componentes/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent) },
    {path: 'mis-turnos', loadComponent: () => import('./componentes/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent) },

];
