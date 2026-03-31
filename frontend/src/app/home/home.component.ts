import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  agendaMenuAberto = false;

  constructor(private router: Router) {}

  irParaAgenda()           { this.router.navigate(['/agenda']); }
  toggleAgendaMenu()       { this.agendaMenuAberto = !this.agendaMenuAberto; }
  irParaAgendaDoutora(d: string) { this.router.navigate(['/agenda-doutora'], { queryParams: { doutora: d } }); }
  irParaPacientes()        { this.router.navigate(['/pacientes']); }
}
