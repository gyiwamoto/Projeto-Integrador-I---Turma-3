import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface UsuarioSessao {
  nome: string;
  tipo_usuario: 'admin' | 'dentista' | 'recepcionista';
}

@Component({
  selector: 'app-admin-area',
  standalone: true,
  templateUrl: './admin-area.component.html',
  styleUrl: './admin-area.component.scss',
})
export class AdminAreaComponent {
  @Input() exibirRotulo = true;
  @Input() rotulo = 'Area administrativa';

  carregando = false;
  sessaoAtiva = false;
  usuarioLogado: UsuarioSessao | null = null;

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {
    this.sessaoAtiva = this.authService.possuiToken();
    this.usuarioLogado = this.authService.obterSessaoAutenticada() as UsuarioSessao | null;

    this.authService.validarSessao().subscribe((autenticado) => {
      this.sessaoAtiva = autenticado;
      this.usuarioLogado = autenticado
        ? (this.authService.obterSessaoAutenticada() as UsuarioSessao | null)
        : null;
    });
  }

  temSessaoAtiva(): boolean {
    return this.sessaoAtiva;
  }

  irParaLogin(): void {
    void this.router.navigateByUrl('/login');
  }

  irParaDashboard(): void {
    if (!this.temSessaoAtiva()) {
      return;
    }

    void this.router.navigateByUrl('/dashboard');
  }

  estaNaAreaAdministrativa(): boolean {
    return (this.router.url ?? '').startsWith('/dashboard');
  }

  obterIdentificacaoUsuario(): string {
    if (!this.usuarioLogado) {
      return '';
    }

    const prefixo =
      this.usuarioLogado.tipo_usuario === 'admin'
        ? 'Admin'
        : this.usuarioLogado.tipo_usuario === 'dentista'
          ? 'Dentista'
          : 'Recepcionista';
    return `${prefixo} ${this.usuarioLogado.nome}`;
  }

  logout(): void {
    this.carregando = true;

    this.authService.logout().subscribe({
      next: () => {
        this.carregando = false;
        this.sessaoAtiva = false;
        this.usuarioLogado = null;
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.carregando = false;
        this.authService.removerToken();
        this.sessaoAtiva = false;
        this.usuarioLogado = null;
        void this.router.navigateByUrl('/');
      },
    });
  }
}
