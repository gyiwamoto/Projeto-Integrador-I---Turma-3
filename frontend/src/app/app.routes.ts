import { Routes } from '@angular/router';
import { LoginComponent }              from './login/login.component';
import { HomeComponent }               from './home/home.component';
import { AgendaComponent }             from './agenda/agenda.component';
import { AgendaDouToraComponent }      from './agenda-doutora/agenda-doutora.component';
import { AgendamentoComponent }        from './agendamento/agendamento.component';
import { CadastroPacienteComponent }   from './cadastro-paciente/cadastro-paciente.component';
import { PacientesComponent }          from './pacientes/pacientes.component';
import { HistoricoPacienteComponent }  from './historico-paciente/historico-paciente.component';

export const routes: Routes = [
  { path: '',                   redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',              component: LoginComponent },
  { path: 'home',               component: HomeComponent },
  { path: 'agenda',             component: AgendaComponent },
  { path: 'agenda-doutora',     component: AgendaDouToraComponent },
  { path: 'agendamento',        component: AgendamentoComponent },
  { path: 'cadastro-paciente',  component: CadastroPacienteComponent },
  { path: 'pacientes',          component: PacientesComponent },
  { path: 'historico-paciente', component: HistoricoPacienteComponent },
];
