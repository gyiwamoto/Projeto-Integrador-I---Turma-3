import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
  adminOnly: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  constructor(private readonly authService: AuthService) {}

  readonly menuItems: MenuItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'space_dashboard', adminOnly: false },
    {
      label: 'Agendar Consulta',
      route: '/dashboard/agendar-consulta',
      icon: 'calendar_month',
      adminOnly: false,
    },
    {
      label: 'Atendimento',
      route: '/dashboard/atendimento',
      icon: 'medical_information',
      adminOnly: false,
    },
    { label: 'Consultas', route: '/dashboard/consultas', icon: 'event_note', adminOnly: false },
    { label: 'Pacientes', route: '/dashboard/pacientes', icon: 'groups', adminOnly: false },
    { label: 'Convenios', route: '/dashboard/convenios', icon: 'work_history', adminOnly: false },
    { label: 'Minha Conta', route: '/dashboard/minha-conta', icon: 'person', adminOnly: false },
    {
      label: 'Usuarios',
      route: '/dashboard/usuarios',
      icon: 'admin_panel_settings',
      adminOnly: true,
    },
  ];

  get usuarioNome(): string {
    return this.authService.obterSessaoAutenticada()?.nome ?? 'Usuário';
  }

  get menuItemsVisiveis(): MenuItem[] {
    const ehAdmin = this.authService.ehAdmin();

    return this.menuItems.filter((item) => !item.adminOnly || ehAdmin);
  }
}
