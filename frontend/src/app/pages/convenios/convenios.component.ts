import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';
import { ModalComponent } from '../../components/modal/modal.component';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';
import { ConvenioItem, SalvarConvenioPayload } from '../../interfaces/Convenio';
import { ConveniosService } from '../../services/convenios.service';
import { formatarData } from '../../utils/formatar-data';

type ModoFormularioConvenio = 'criar' | 'editar';

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TabelaComponent, ModalComponent, FiltrosComponent],
  templateUrl: './convenios.component.html',
  styleUrl: './convenios.component.scss',
})
export class ConveniosPage implements OnInit {
  private readonly conveniosService = inject(ConveniosService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'cnpj', titulo: 'CNPJ' },
    { chave: 'nome', titulo: 'Nome' },
    {
      chave: 'ativo',
      titulo: 'Status',
      formatador: (valor) => (valor ? 'Ativo' : 'Inativo'),
    },
    {
      chave: 'atualizado_em',
      titulo: 'Atualizado em',
      formatador: (valor) => formatarData(valor),
    },
  ];

  readonly camposFiltro: FiltroCampo[] = [
    {
      key: 'busca',
      label: 'Busca',
      type: 'text',
      placeholder: 'Nome do convenio',
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
  ];

  carregando = false;
  salvando = false;
  excluindo = false;
  erroMensagem = '';
  sucessoMensagem = '';
  filtros: Record<string, string> = {};

  convenios: ConvenioItem[] = [];
  convenioSelecionado: ConvenioItem | null = null;
  modalConvenioAberto = false;
  modalExclusaoAberto = false;
  modoFormulario: ModoFormularioConvenio = 'criar';

  readonly formConvenio = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cnpj: [''],
    ativo: [true, [Validators.required]],
  });

  readonly acaoEditarConvenio = (linha: TabelaLinha): void => {
    this.abrirEdicaoConvenio(linha as unknown as ConvenioItem);
  };

  readonly acaoExcluirConvenio = (linha: TabelaLinha): void => {
    this.abrirExclusaoConvenio(linha as unknown as ConvenioItem);
  };

  ngOnInit(): void {
    this.carregarConvenios();
  }

  get conveniosFiltrados(): ConvenioItem[] {
    const termo = (this.filtros['busca'] ?? '').trim().toLowerCase();
    const ativo = (this.filtros['ativo'] ?? '').trim().toLowerCase();

    return this.convenios.filter((convenio) => {
      const passouBusca = !termo || convenio.nome.toLowerCase().includes(termo);
      const status = convenio.ativo ? 'sim' : 'nao';
      const passouAtivo = !ativo || status === ativo;

      return passouBusca && passouAtivo;
    });
  }

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtros = filtros;
  }

  get linhasTabelaConvenios(): TabelaLinha[] {
    return this.conveniosFiltrados as unknown as TabelaLinha[];
  }

  abrirNovoConvenio(): void {
    this.erroMensagem = '';
    this.sucessoMensagem = '';
    this.modoFormulario = 'criar';
    this.convenioSelecionado = null;
    this.modalConvenioAberto = true;
    this.formConvenio.reset({
      nome: '',
      ativo: true,
    });
  }

  abrirEdicaoConvenio(convenio: ConvenioItem): void {
    this.erroMensagem = '';
    this.sucessoMensagem = '';
    this.modoFormulario = 'editar';
    this.convenioSelecionado = convenio;
    this.modalConvenioAberto = true;
    this.formConvenio.reset({
      nome: convenio.nome,
      cnpj: convenio.cnpj ?? '',
      ativo: convenio.ativo,
    });
  }

  salvarConvenio(): void {
    if (this.formConvenio.invalid) {
      this.formConvenio.markAllAsTouched();
      return;
    }

    const valor = this.formConvenio.getRawValue();
    const payload: SalvarConvenioPayload = {
      nome: (valor.nome ?? '').trim(),
      cnpj: (valor.cnpj ?? '').trim(),
      ativo: Boolean(valor.ativo),
    };

    if (this.modoFormulario === 'criar') {
      this.criarConvenio(payload);
      return;
    }

    if (!this.convenioSelecionado) {
      return;
    }

    this.atualizarConvenio(this.convenioSelecionado.id, payload);
  }

  abrirExclusaoConvenio(convenio: ConvenioItem): void {
    this.convenioSelecionado = convenio;
    this.modalExclusaoAberto = true;
    this.erroMensagem = '';
    this.sucessoMensagem = '';
  }

  confirmarExclusaoConvenio(): void {
    if (!this.convenioSelecionado) {
      return;
    }

    this.excluindo = true;
    this.conveniosService.excluirConvenio(this.convenioSelecionado.id).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.convenios = this.convenios.filter((item) => item.id !== this.convenioSelecionado?.id);
        this.modalExclusaoAberto = false;
        this.convenioSelecionado = null;
        this.excluindo = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.excluindo = false;
        this.erroMensagem = error.message || 'Nao foi possivel excluir o convenio.';
        this.cdr.markForCheck();
      },
    });
  }

  fecharModalConvenio(): void {
    this.modalConvenioAberto = false;
    this.convenioSelecionado = null;
    this.formConvenio.reset({
      nome: '',
      ativo: true,
    });
  }

  fecharModalExclusao(): void {
    this.modalExclusaoAberto = false;
    this.convenioSelecionado = null;
  }

  private carregarConvenios(): void {
    this.carregando = true;
    this.erroMensagem = '';

    this.conveniosService.listarConvenios().subscribe({
      next: (resposta) => {
        this.convenios = resposta.convenios;
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.carregando = false;
        this.erroMensagem = error.message || 'Nao foi possivel carregar os convenios.';
        this.cdr.markForCheck();
      },
    });
  }

  private criarConvenio(payload: SalvarConvenioPayload): void {
    this.salvando = true;
    this.erroMensagem = '';

    this.conveniosService.criarConvenio(payload).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.salvando = false;
        this.fecharModalConvenio();
        this.carregarConvenios();
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.erroMensagem = error.message || 'Nao foi possivel criar o convenio.';
        this.cdr.markForCheck();
      },
    });
  }

  private atualizarConvenio(convenioId: string, payload: SalvarConvenioPayload): void {
    this.salvando = true;
    this.erroMensagem = '';

    this.conveniosService.editarConvenio(convenioId, payload).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.salvando = false;
        this.fecharModalConvenio();
        this.carregarConvenios();
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.erroMensagem = error.message || 'Nao foi possivel atualizar o convenio.';
        this.cdr.markForCheck();
      },
    });
  }
}
