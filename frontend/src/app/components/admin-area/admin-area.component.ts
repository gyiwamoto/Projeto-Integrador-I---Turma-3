import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from '../../services/auth.service';

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

  constructor(
    private readonly router: Router,
    private readonly authApiService: AuthApiService,
  ) {
    this.authApiService.validarSessao().subscribe((autenticado) => {
      this.sessaoAtiva = autenticado;
    });
  }

  temSessaoAtiva(): boolean {
    return this.sessaoAtiva;
  }

  irParaLogin(): void {
    void this.router.navigateByUrl('/login');
  }

  logout(): void {
    this.carregando = true;

    this.authApiService.logout().subscribe({
      next: () => {
        this.carregando = false;
        this.sessaoAtiva = false;
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.carregando = false;
        this.authApiService.removerToken();
        this.sessaoAtiva = false;
        void this.router.navigateByUrl('/');
      },
    });
  }
}
