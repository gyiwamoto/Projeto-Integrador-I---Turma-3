import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  readonly menuItems: MenuItem[] = [
    { label: 'Inicio', route: '/', icon: 'home' },
    { label: 'Pacientes', route: '/', icon: 'group' },
    { label: 'Consultas', route: '/', icon: 'event' },
    { label: 'Tratamentos', route: '/', icon: 'healing' },
    { label: 'Convenios', route: '/', icon: 'assignment' },
  ];
}
