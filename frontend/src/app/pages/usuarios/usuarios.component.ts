import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';
import { ModalComponent } from '../../components/modal/modal.component';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';
import { AuthService } from '../../services/auth.service';
import { CriarUsuarioPayload, TipoUsuario, UsuarioListaItem } from '../../interfaces/Usuario';
import { UsuariosService } from '../../services/usuarios.service';
import { formatarData } from '../../utils/formatar-data';

type ModoFormularioUsuario = 'criar' | 'editar';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TabelaComponent, ModalComponent, FiltrosComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly fb = inject(FormBuilder);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'id', titulo: 'ID' },
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'email', titulo: 'Email' },
    { chave: 'tipo_usuario', titulo: 'Tipo' },
    {
      chave: 'ativo',
      titulo: 'Status',
      formatador: (valor) => (valor ? 'Ativo' : 'Inativo'),
    },
    {
      chave: 'criado_em',
      titulo: 'Criado em',
      formatador: (valor) => formatarData(valor),
    },
  ];

  readonly camposFiltro: FiltroCampo[] = [
    {
      key: 'tipo_usuario',
      label: 'Tipo de usuario',
      type: 'select',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Dentista', value: 'dentista' },
        { label: 'Recepcionista', value: 'recepcionista' },
      ],
    },
    {
      key: 'ativo',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Ativo', value: 'sim' },
        { label: 'Inativo', value: 'nao' },
      ],
    },
    {
      key: 'busca',
      label: 'Busca',
      type: 'text',
      placeholder: 'Nome, email ou ID',
    },
  ];

  ehAdmin = false;
  carregando = false;
  salvando = false;
  excluindo = false;
  erroMensagem = '';
  sucessoMensagem = '';
  filtros: Record<string, string> = {};

  usuarios: UsuarioListaItem[] = [];
  usuarioSelecionado: UsuarioListaItem | null = null;
  usuarioParaExcluir: UsuarioListaItem | null = null;
  modalUsuarioAberto = false;
  modalExclusaoAberto = false;
  modoFormulario: ModoFormularioUsuario = 'criar';
  modoEdicaoUsuario = true;

  readonly formUsuario = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [this.senhaOpcionalOuObrigatoriaValidator()]],
    tipo_usuario: ['recepcionista' as TipoUsuario, [Validators.required]],
  });

  readonly excluirDesabilitado = () => !this.ehAdmin;

  readonly acaoEditarUsuario = (linha: TabelaLinha): void => {
    this.abrirEdicaoUsuario(linha as unknown as UsuarioListaItem);
  };

  readonly acaoExcluirUsuario = (linha: TabelaLinha): void => {
    this.abrirExclusaoUsuario(linha as unknown as UsuarioListaItem);
  };

  ngOnInit(): void {
    this.ehAdmin = this.authService.ehAdmin();
    void this.carregarUsuarios();
  }

  get usuariosFiltrados(): UsuarioListaItem[] {
    const termo = (this.filtros['busca'] ?? '').trim().toLowerCase();
    const tipoUsuario = (this.filtros['tipo_usuario'] ?? '').trim().toLowerCase();
    const ativo = (this.filtros['ativo'] ?? '').trim().toLowerCase();

    return this.usuarios.filter((usuario) => {
      const ativoUsuario = this.usuarioEstaAtivo(usuario) ? 'sim' : 'nao';
      const passouBusca =
        !termo || [usuario.id, usuario.nome, usuario.email].join(' ').toLowerCase().includes(termo);

      const passouTipo = !tipoUsuario || usuario.tipo_usuario.toLowerCase() === tipoUsuario;
      const passouAtivo = !ativo || ativoUsuario === ativo;

      return passouBusca && passouTipo && passouAtivo;
    });
  }

  get linhasTabelaUsuarios(): TabelaLinha[] {
    return this.usuariosFiltrados.map((usuario) => ({
      ...usuario,
      ativo: this.usuarioEstaAtivo(usuario),
      tipo_usuario: usuario.tipo_usuario,
    })) as unknown as TabelaLinha[];
  }

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtros = filtros;
  }

  get formularioEmModoEdicao(): boolean {
    return this.modoFormulario === 'criar' || this.modoEdicaoUsuario;
  }

  get nomeControl() {
    return this.formUsuario.get('nome');
  }

  get emailControl() {
    return this.formUsuario.get('email');
  }

  get senhaControl() {
    return this.formUsuario.get('senha');
  }

  abrirNovoUsuario(): void {
    this.erroMensagem = '';
    this.sucessoMensagem = '';
    this.modoFormulario = 'criar';
    this.modoEdicaoUsuario = true;
    this.usuarioSelecionado = null;
    this.modalUsuarioAberto = true;
    this.configurarValidacaoSenha(true);
    this.formUsuario.reset({
      nome: '',
      email: '',
      senha: '',
      tipo_usuario: 'recepcionista',
    });
    this.atualizarEstadoFormularioEdicao();
  }

  abrirEdicaoUsuario(usuario: UsuarioListaItem): void {
    this.erroMensagem = '';
    this.sucessoMensagem = '';
    this.modoFormulario = 'editar';
    this.modoEdicaoUsuario = false;
    this.usuarioSelecionado = usuario;
    this.modalUsuarioAberto = true;
    this.configurarValidacaoSenha(false);
    this.formUsuario.reset({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      tipo_usuario: usuario.tipo_usuario,
    });
    this.atualizarEstadoFormularioEdicao();
  }

  ativarEdicaoUsuario(): void {
    if (!this.usuarioSelecionado) {
      return;
    }

    this.modoEdicaoUsuario = true;
    this.configurarValidacaoSenha(false);
    this.atualizarEstadoFormularioEdicao();
  }

  cancelarEdicaoUsuario(): void {
    if (this.modoFormulario === 'criar') {
      this.fecharModalUsuario();
      return;
    }

    if (!this.usuarioSelecionado) {
      this.fecharModalUsuario();
      return;
    }

    this.modoEdicaoUsuario = false;
    this.configurarValidacaoSenha(false);
    this.formUsuario.reset({
      nome: this.usuarioSelecionado.nome,
      email: this.usuarioSelecionado.email,
      senha: '',
      tipo_usuario: this.usuarioSelecionado.tipo_usuario,
    });
    this.atualizarEstadoFormularioEdicao();
  }

  salvarUsuario(): void {
    if (this.formUsuario.invalid) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    const valor = this.formUsuario.getRawValue();
    const nome = (valor.nome ?? '').trim();
    const email = (valor.email ?? '').trim();
    const senha = (valor.senha ?? '').trim();
    const tipoUsuario = valor.tipo_usuario as TipoUsuario;

    if (this.modoFormulario === 'criar') {
      this.salvarNovoUsuario({ nome, email, senha, tipo_usuario: tipoUsuario });
      return;
    }

    if (!this.usuarioSelecionado) {
      return;
    }

    this.salvarEdicaoUsuario(this.usuarioSelecionado.id, {
      nome,
      email,
      tipo_usuario: tipoUsuario,
      ...(senha ? { senha } : {}),
    });
  }

  abrirExclusaoUsuario(usuario: UsuarioListaItem): void {
    this.erroMensagem = '';
    this.sucessoMensagem = '';
    this.usuarioParaExcluir = usuario;
    this.modalExclusaoAberto = true;
  }

  fecharModalUsuario(): void {
    this.modalUsuarioAberto = false;
    this.modoFormulario = 'criar';
    this.modoEdicaoUsuario = true;
    this.usuarioSelecionado = null;
    this.formUsuario.reset({
      nome: '',
      email: '',
      senha: '',
      tipo_usuario: 'recepcionista',
    });
    this.configurarValidacaoSenha(true);
    this.atualizarEstadoFormularioEdicao();
  }

  fecharModalExclusao(): void {
    this.modalExclusaoAberto = false;
    this.usuarioParaExcluir = null;
  }

  confirmarExclusaoUsuario(): void {
    if (!this.usuarioParaExcluir) {
      return;
    }

    this.excluindo = true;
    this.erroMensagem = '';
    this.sucessoMensagem = '';

    this.usuariosService.excluirUsuario(this.usuarioParaExcluir.id).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.fecharModalExclusao();
        this.excluindo = false;
        this.sincronizarUsuariosComCache();
      },
      error: (error: Error) => {
        this.excluindo = false;
        this.erroMensagem = error.message || 'Nao foi possivel excluir o usuario.';
      },
    });
  }

  private carregarUsuarios(): void {
    this.carregando = true;
    this.erroMensagem = '';

    this.usuariosService
      .listarUsuarios()
      .pipe(
        finalize(() => {
          this.carregando = false;
        }),
      )
      .subscribe({
        next: (resposta) => {
          this.usuarios = Array.isArray(resposta?.usuarios) ? resposta.usuarios : [];
        },
        error: (error: Error) => {
          this.erroMensagem = error.message || 'Nao foi possivel carregar os usuarios.';
        },
      });
  }

  private sincronizarUsuariosComCache(): void {
    this.usuarios = this.usuariosService.obterUsuariosEmCache();
  }

  private salvarNovoUsuario(payload: CriarUsuarioPayload): void {
    this.salvando = true;
    this.erroMensagem = '';
    this.sucessoMensagem = '';

    this.usuariosService.criarUsuario(payload).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.salvando = false;
        this.fecharModalUsuario();
        this.sincronizarUsuariosComCache();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.erroMensagem = error.message || 'Nao foi possivel criar o usuario.';
      },
    });
  }

  private salvarEdicaoUsuario(
    usuarioId: string,
    payload: {
      nome: string;
      email: string;
      senha?: string;
      tipo_usuario: TipoUsuario;
    },
  ): void {
    this.salvando = true;
    this.erroMensagem = '';
    this.sucessoMensagem = '';

    this.usuariosService.editarUsuario(usuarioId, payload).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.salvando = false;
        this.fecharModalUsuario();
        this.sincronizarUsuariosComCache();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.erroMensagem = error.message || 'Nao foi possivel atualizar o usuario.';
      },
    });
  }

  private configurarValidacaoSenha(criando: boolean): void {
    const senha = this.senhaControl;

    if (!senha) {
      return;
    }

    if (criando) {
      senha.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      senha.setValidators([this.senhaOpcionalOuObrigatoriaValidator()]);
    }

    senha.updateValueAndValidity({ emitEvent: false });
  }

  private atualizarEstadoFormularioEdicao(): void {
    if (this.formularioEmModoEdicao) {
      this.formUsuario.enable({ emitEvent: false });
      return;
    }

    this.formUsuario.disable({ emitEvent: false });
  }

  private senhaOpcionalOuObrigatoriaValidator(): ValidatorFn {
    return (control: AbstractControl<string | null>): ValidationErrors | null => {
      const valor = (control.value ?? '').trim();

      if (!valor) {
        return null;
      }

      if (valor.length < 6) {
        return {
          minlength: {
            requiredLength: 6,
            actualLength: valor.length,
          },
        };
      }

      return null;
    };
  }

  private usuarioEstaAtivo(usuario: UsuarioListaItem): boolean {
    const valor = (usuario as UsuarioListaItem & { ativo?: boolean | null }).ativo;

    if (typeof valor === 'boolean') {
      return valor;
    }

    return true;
  }
}
