import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthApiService } from '../../services/auth.service';

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
  constructor(private readonly authApiService: AuthApiService) {}

  readonly menuItems: MenuItem[] = [
    { label: 'Inicio', route: '/', icon: 'home', adminOnly: false },
    { label: 'Consultas', route: '/consultas', icon: 'event', adminOnly: false },
    { label: 'Pacientes', route: '/pacientes', icon: 'group', adminOnly: false },
    { label: 'Convenios', route: '/convenios', icon: 'assignment', adminOnly: false },
    { label: 'Tratamentos', route: '/tratamentos', icon: 'healing', adminOnly: false },
    { label: 'Usuarios', route: '/usuarios', icon: 'person', adminOnly: true },
  ];

  get menuItemsVisiveis(): MenuItem[] {
    const usuario = this.authApiService.obterUsuarioAtual();
    const ehAdmin = usuario?.tipo_usuario === 'admin';

    return this.menuItems.filter((item) => !item.adminOnly || ehAdmin);
  }
}
