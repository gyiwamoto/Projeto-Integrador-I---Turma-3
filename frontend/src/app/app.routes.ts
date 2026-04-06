import { Routes } from '@angular/router';
import { authGuard, adminGuard, loginGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { PacientesComponent } from './pages/pacientes/pacientes.component';
import { MinhaContaPage } from './pages/minha-conta/minha-conta.component';
import { UsuariosPage } from './pages/usuarios/usuarios.component';
import { MainLayoutComponent } from './layout/main-layout.component';
import { ConsultasComponent } from './pages/consultas/consultas.component';
import { ConveniosPage } from './pages/convenios/convenios.component';
import { TratamentosPage } from './pages/tratamentos/tratamentos.component';
import { AtendimentoComponent } from './pages/atendimento/atendimento.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'dashboard', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardComponent, pathMatch: 'full' },
      { path: 'consultas', component: ConsultasComponent },
      { path: 'atendimento', component: AtendimentoComponent },
      { path: 'agendar-consulta', component: AgendaComponent },
      { path: 'pacientes', component: PacientesComponent },
      { path: 'tratamentos', component: TratamentosPage },
      { path: 'convenios', component: ConveniosPage },
      { path: 'minha-conta', component: MinhaContaPage },
      { path: 'usuarios', component: UsuariosPage, canActivate: [adminGuard] },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
