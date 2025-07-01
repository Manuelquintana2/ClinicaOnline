import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component'
import { SeccionUsuariosComponent } from './componentes/seccion-usuarios/seccion-usuarios.component';
import { RegistroAdminComponent } from './componentes/registro-admin/registro-admin.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    { path: 'home', component: HomeComponent, data: { animation: 'home' } },
    { path:"login", component: LoginComponent},
    { path:"registro", component: RegistroComponent},
    { path:"admin/seccion-usuarios", component: SeccionUsuariosComponent},
    { path:"admin/registro-admin", component: RegistroAdminComponent},
    { path: 'mis-turnos', loadComponent: () => import('./componentes/mis-turnos/mis-turnos.component').then(m => m.MisTurnosComponent), data: { animation: 'mis-turnos' } },
    { path: 'solicitar-turno', loadComponent: () => import('./componentes/solicitar-turno/solicitar-turno.component').then(m => m.SolicitarTurnoComponent), data: { animation: 'solicitar-turno' } },
    { path: 'pacientes', loadComponent: () => import('./componentes/seccion-pacientes/seccion-pacientes.component').then(m => m.SeccionPacientesComponent) },
    { path: 'mi-perfil', loadComponent: () => import('./componentes/mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent), data: { animation: 'mi-perfil' } },
    { path: 'admin-estadisticas', loadComponent: () => import('./componentes/admin-estadisticas/admin-estadisticas.component').then(m => m.AdminEstadisticasComponent), data: { animation: 'admin-estadisticas' } },
];
