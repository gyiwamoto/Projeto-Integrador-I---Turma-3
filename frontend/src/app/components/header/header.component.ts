import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  @Input() titulo = 'Dentista Organizado';
  @Input() subtitulo = 'Painel clinico';

  verificandoSessao = true;
  sessaoAtiva = false;
  usuarioNome = '';
  usuarioTipo = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.authService.validarSessaoComCache().subscribe((autenticado) => {
      this.sessaoAtiva = autenticado;
      this.verificandoSessao = false;

      const usuario = this.authService.obterSessaoAutenticada();
      this.usuarioNome = usuario?.nome ?? 'Usuário';
      this.usuarioTipo = usuario?.tipo_usuario ?? '';
    });
  }

  obterDescricaoUsuario(): string {
    const tipos: Record<string, string> = {
      admin: 'Administrador',
      dentista: 'Dentista',
      recepcionista: 'Recepcionista',
    };

    return tipos[this.usuarioTipo] ?? 'Acesso autenticado';
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.encerrarSessao(),
      error: () => this.encerrarSessao(),
    });
  }

  private encerrarSessao(): void {
    this.authService.removerToken();
    void this.router.navigate(['/login'], { replaceUrl: true });
  }
}
