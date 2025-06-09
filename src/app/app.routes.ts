import { Routes } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { LoginComponent } from './componentes/login/login.component';
import { RegistroComponent } from './componentes/registro/registro.component'
import { SeccionUsuariosComponent } from './componentes/seccion-usuarios/seccion-usuarios.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: "full" },
    {path:"home", component: HomeComponent},
    {path:"login", component: LoginComponent},
    {path:"registro", component: RegistroComponent},
    {path:"admin/seccion-usuarios", component: SeccionUsuariosComponent},

];
