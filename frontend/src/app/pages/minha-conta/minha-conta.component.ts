import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AgendaConsulta } from '../../interfaces/Agenda';
import { AgendaService } from '../../services/agenda.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { UsuariosService } from '../../services/usuarios.service';
import { formatarData, formatarDataHora } from '../../utils/formatar-data';

@Component({
  selector: 'app-minha-conta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './minha-conta.component.html',
  styleUrl: './minha-conta.component.scss',
})
export class MinhaContaPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly agendaService = inject(AgendaService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly toastService = inject(ToastService);

  readonly formConta = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    senhaNova: [''],
    senhaConfirmacao: [''],
  });

  readonly formSenhaAtual = this.formBuilder.nonNullable.group({
    senhaAtual: ['', [Validators.required, Validators.minLength(6)]],
  });

  tipoUsuario = '';
  tipoUsuarioSlug = '';
  nomeUsuario = '';
  usuarioId = '';
  carregandoAgendamentos = false;
  meusAgendamentos: AgendaConsulta[] = [];
  mostraSecaoSenha = false;
  mostraModalSenhaAtual = false;
  salvandoSenha = false;
  mostrarSenhaNova = false;
  mostrarSenhaConfirmacao = false;
  mostrarSenhaAtual = false;

  ngOnInit(): void {
    const usuario = this.authService.obterSessaoAutenticada();
    if (!usuario) {
      return;
    }

    this.formConta.patchValue({
      nome: usuario.nome,
      email: usuario.email,
    });
    this.nomeUsuario = usuario.nome;
    this.usuarioId = String(usuario.id);
    this.tipoUsuarioSlug = usuario.tipo_usuario;
    this.tipoUsuario = this.descricaoTipoUsuario(usuario.tipo_usuario);

    if (this.tipoUsuarioSlug === 'admin' || this.tipoUsuarioSlug === 'dentista') {
      this.carregarMeusAgendamentos();
    }
  }

  get exibirMeusAgendamentos(): boolean {
    return this.tipoUsuarioSlug === 'admin' || this.tipoUsuarioSlug === 'dentista';
  }

  get listaAgendamentosMinhaConta(): AgendaConsulta[] {
    if (this.tipoUsuarioSlug === 'admin') {
      return this.meusAgendamentos;
    }

    const profissional = this.normalizar(this.nomeUsuario);

    return this.meusAgendamentos.filter((consulta) => {
      const nomeConsulta = this.normalizar(consulta.profissionalNome);
      return profissional && nomeConsulta.includes(profissional);
    });
  }

  formatarDataConsulta(dataConsulta: string): string {
    return formatarDataHora(dataConsulta);
  }

  formatarStatus(status: AgendaConsulta['status']): string {
    if (status === 'agendado') {
      return 'Agendado';
    }

    if (status === 'realizado') {
      return 'Realizado';
    }

    return 'Cancelado';
  }

  salvar(): void {
    if (this.formConta.invalid) {
      this.formConta.markAllAsTouched();
      this.toastService.erro('Preencha os dados antes de continuar.');
      return;
    }

    if (!this.formConta.dirty) {
      this.toastService.info('Nenhuma alteracao foi feita.');
      return;
    }

    if (this.mostraSecaoSenha) {
      if (!this.temSenhaPreenchida()) {
        this.toastService.erro('Informe e confirme a nova senha.');
        return;
      }

      if (!this.senhasCoincidem()) {
        this.toastService.erro('As senhas novas precisam ser iguais.');
        return;
      }

      this.acaoAtual = 'senha';
    } else {
      this.acaoAtual = 'conta';
    }

    this.formSenhaAtual.reset();
    this.mostraModalSenhaAtual = true;
  }

  acaoAtual: 'conta' | 'senha' = 'conta';

  alternarSecaoSenha(): void {
    this.mostraSecaoSenha = !this.mostraSecaoSenha;
  }

  fecharModalSenhaAtual(): void {
    if (this.salvandoSenha) {
      return;
    }

    this.mostraModalSenhaAtual = false;
    this.formSenhaAtual.reset();
  }

  confirmarTrocaSenha(): void {
    if (this.formSenhaAtual.invalid) {
      this.formSenhaAtual.markAllAsTouched();
      this.toastService.erro('Digite a senha atual para confirmar a alteracao.');
      return;
    }

    this.salvandoSenha = true;
    const { senhaAtual } = this.formSenhaAtual.getRawValue();
    const valoresConta = this.formConta.getRawValue();

    if (this.acaoAtual === 'senha') {
      if (!this.temSenhaPreenchida()) {
        this.salvandoSenha = false;
        this.toastService.erro('Informe e confirme a nova senha.');
        return;
      }

      if (!this.senhasCoincidem()) {
        this.salvandoSenha = false;
        this.toastService.erro('As senhas novas precisam ser iguais.');
        return;
      }
    }

    const payload =
      this.acaoAtual === 'conta'
        ? {
            nome: valoresConta.nome,
            email: valoresConta.email,
            senhaAtual,
          }
        : {
            senhaAtual,
            senhaNova: this.formConta.getRawValue().senhaNova,
          };

    this.usuariosService.editarMinhaConta(this.usuarioId, payload).subscribe({
      next: (resposta) => {
        this.salvandoSenha = false;
        this.formConta.patchValue({
          senhaNova: '',
          senhaConfirmacao: '',
        });
        this.formConta.markAsPristine();
        this.mostraModalSenhaAtual = false;
        this.formSenhaAtual.reset();
        this.mostrarSenhaNova = false;
        this.mostrarSenhaConfirmacao = false;
        this.mostrarSenhaAtual = false;
        this.toastService.sucesso(resposta.mensagem);
      },
      error: (error: Error) => {
        this.salvandoSenha = false;
        this.toastService.erro(error.message);
      },
    });
  }

  alternarVisualizacaoSenhaNova(): void {
    this.mostrarSenhaNova = !this.mostrarSenhaNova;
  }

  alternarVisualizacaoSenhaConfirmacao(): void {
    this.mostrarSenhaConfirmacao = !this.mostrarSenhaConfirmacao;
  }

  alternarVisualizacaoSenhaAtual(): void {
    this.mostrarSenhaAtual = !this.mostrarSenhaAtual;
  }

  get podeSalvar(): boolean {
    return (
      this.formConta.valid &&
      this.formConta.dirty &&
      (!this.mostraSecaoSenha || this.temSenhaPreenchida())
    );
  }

  private temSenhaPreenchida(): boolean {
    const valoresSenha = this.formConta.getRawValue();
    return Boolean(valoresSenha.senhaNova || valoresSenha.senhaConfirmacao);
  }

  private senhasCoincidem(): boolean {
    const valoresSenha = this.formConta.getRawValue();
    return valoresSenha.senhaNova === valoresSenha.senhaConfirmacao;
  }

  private carregarMeusAgendamentos(): void {
    this.carregandoAgendamentos = true;
    this.cdr.markForCheck();

    this.agendaService
      .listarConsultas(true)
      .pipe(
        finalize(() => {
          this.carregandoAgendamentos = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (consultas) => {
          this.meusAgendamentos = consultas ?? [];
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          this.toastService.erro(error.message || 'Nao foi possivel carregar agendamentos.');
          this.cdr.markForCheck();
        },
      });
  }

  private descricaoTipoUsuario(tipo: string): string {
    if (tipo === 'admin') {
      return 'Administrador';
    }

    if (tipo === 'dentista') {
      return 'Dentista';
    }

    return 'Recepcionista';
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
