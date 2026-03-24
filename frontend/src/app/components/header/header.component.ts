import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  @Input() titulo = 'Dentista Organizado';
  @Input() subtitulo = 'Gestao clinica';

  verificandoSessao = true;
  sessaoAtiva = false;

  constructor(private readonly authApiService: AuthApiService) {}

  ngOnInit(): void {
    this.authApiService.validarSessao().subscribe((autenticado) => {
      this.sessaoAtiva = autenticado;
      this.verificandoSessao = false;
    });
  }
}
