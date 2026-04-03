import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';
import { ModalComponent } from '../../components/modal/modal.component';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';
import {
  SalvarTratamentoPayload,
  TratamentoItem,
  TratamentosService,
} from '../../services/tratamentos.service';

type ModoFormularioTratamento = 'criar' | 'editar';

@Component({
  selector: 'app-tratamentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TabelaComponent, ModalComponent, FiltrosComponent],
  templateUrl: './tratamentos.component.html',
  styleUrl: './tratamentos.component.scss',
})
export class TratamentosPage implements OnInit {
  private readonly tratamentosService = inject(TratamentosService);
  private readonly fb = inject(FormBuilder);

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'nome', titulo: 'Nome' },
    {
      chave: 'descricao',
      titulo: 'Descricao',
      formatador: (valor) => this.formatarDescricao(valor),
    },
    {
      chave: 'valor',
      titulo: 'Valor',
      formatador: (valor) => this.formatarValor(valor),
    },
    {
      chave: 'ativo',
      titulo: 'Status',
      formatador: (valor) => (valor ? 'Ativo' : 'Inativo'),
    },
    {
      chave: 'atualizado_em',
      titulo: 'Atualizado em',
      formatador: (valor) => this.formatarData(valor),
    },
  ];

  readonly camposFiltro: FiltroCampo[] = [
    {
      key: 'busca',
      label: 'Busca',
      type: 'text',
      placeholder: 'Nome, descricao ou valor',
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

  tratamentos: TratamentoItem[] = [];
  tratamentoSelecionado: TratamentoItem | null = null;
  modalTratamentoAberto = false;
  modalExclusaoAberto = false;
  modoFormulario: ModoFormularioTratamento = 'criar';

  readonly formTratamento = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    descricao: [''],
    valor: [0, [Validators.required, Validators.min(0)]],
    ativo: [true, [Validators.required]],
  });

  readonly acaoEditarTratamento = (linha: TabelaLinha): void => {
    this.abrirEdicaoTratamento(linha as unknown as TratamentoItem);
  };

  readonly acaoExcluirTratamento = (linha: TabelaLinha): void => {
    this.abrirExclusaoTratamento(linha as unknown as TratamentoItem);
  };

  ngOnInit(): void {
    this.carregarTratamentos();
  }

  get tratamentosFiltrados(): TratamentoItem[] {
    const termo = (this.filtros['busca'] ?? '').trim().toLowerCase();
    const ativo = (this.filtros['ativo'] ?? '').trim().toLowerCase();

    return this.tratamentos.filter((tratamento) => {
      const passouBusca =
        !termo ||
        [tratamento.nome, tratamento.descricao ?? '', tratamento.valor]
          .join(' ')
          .toLowerCase()
          .includes(termo);
      const status = tratamento.ativo ? 'sim' : 'nao';
      const passouAtivo = !ativo || status === ativo;

      return passouBusca && passouAtivo;
    });
  }

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtros = filtros;
  }

  get linhasTabelaTratamentos(): TabelaLinha[] {
    return this.tratamentosFiltrados as unknown as TabelaLinha[];
  }

  abrirNovoTratamento(): void {
    this.erroMensagem = '';
    this.sucessoMensagem = '';
    this.modoFormulario = 'criar';
    this.tratamentoSelecionado = null;
    this.modalTratamentoAberto = true;
    this.formTratamento.reset({
      nome: '',
      descricao: '',
      valor: 0,
      ativo: true,
    });
  }

  abrirEdicaoTratamento(tratamento: TratamentoItem): void {
    this.erroMensagem = '';
    this.sucessoMensagem = '';
    this.modoFormulario = 'editar';
    this.tratamentoSelecionado = tratamento;
    this.modalTratamentoAberto = true;
    this.formTratamento.reset({
      nome: tratamento.nome,
      descricao: tratamento.descricao ?? '',
      valor: this.parseValor(tratamento.valor),
      ativo: tratamento.ativo,
    });
  }

  salvarTratamento(): void {
    if (this.formTratamento.invalid) {
      this.formTratamento.markAllAsTouched();
      return;
    }

    const valor = this.formTratamento.getRawValue();
    const payload: SalvarTratamentoPayload = {
      nome: (valor.nome ?? '').trim(),
      descricao: (valor.descricao ?? '').trim(),
      valor: Number(valor.valor ?? 0),
      ativo: Boolean(valor.ativo),
    };

    if (this.modoFormulario === 'criar') {
      this.criarTratamento(payload);
      return;
    }

    if (!this.tratamentoSelecionado) {
      return;
    }

    this.atualizarTratamento(this.tratamentoSelecionado.id, payload);
  }

  abrirExclusaoTratamento(tratamento: TratamentoItem): void {
    this.tratamentoSelecionado = tratamento;
    this.modalExclusaoAberto = true;
    this.erroMensagem = '';
    this.sucessoMensagem = '';
  }

  confirmarExclusaoTratamento(): void {
    if (!this.tratamentoSelecionado) {
      return;
    }

    this.excluindo = true;
    this.tratamentosService.excluirTratamento(this.tratamentoSelecionado.id).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.tratamentos = this.tratamentos.filter(
          (item) => item.id !== this.tratamentoSelecionado?.id,
        );
        this.modalExclusaoAberto = false;
        this.tratamentoSelecionado = null;
        this.excluindo = false;
      },
      error: (error: Error) => {
        this.excluindo = false;
        this.erroMensagem = error.message || 'Nao foi possivel excluir o tratamento.';
      },
    });
  }

  fecharModalTratamento(): void {
    this.modalTratamentoAberto = false;
    this.tratamentoSelecionado = null;
    this.formTratamento.reset({
      nome: '',
      descricao: '',
      valor: 0,
      ativo: true,
    });
  }

  fecharModalExclusao(): void {
    this.modalExclusaoAberto = false;
    this.tratamentoSelecionado = null;
  }

  formatarData(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      return '-';
    }

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      return valor;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(data);
  }

  private carregarTratamentos(): void {
    this.carregando = true;
    this.erroMensagem = '';

    this.tratamentosService.listarTratamentos().subscribe({
      next: (resposta) => {
        this.tratamentos = resposta.tratamentos;
        this.carregando = false;
      },
      error: (error: Error) => {
        this.carregando = false;
        this.erroMensagem = error.message || 'Nao foi possivel carregar os tratamentos.';
      },
    });
  }

  private criarTratamento(payload: SalvarTratamentoPayload): void {
    this.salvando = true;
    this.erroMensagem = '';

    this.tratamentosService.criarTratamento(payload).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.salvando = false;
        this.fecharModalTratamento();
        this.carregarTratamentos();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.erroMensagem = error.message || 'Nao foi possivel criar o tratamento.';
      },
    });
  }

  private atualizarTratamento(tratamentoId: string, payload: SalvarTratamentoPayload): void {
    this.salvando = true;
    this.erroMensagem = '';

    this.tratamentosService.editarTratamento(tratamentoId, payload).subscribe({
      next: (resposta) => {
        this.sucessoMensagem = resposta.mensagem;
        this.salvando = false;
        this.fecharModalTratamento();
        this.carregarTratamentos();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.erroMensagem = error.message || 'Nao foi possivel atualizar o tratamento.';
      },
    });
  }

  private formatarDescricao(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      return '-';
    }

    return valor;
  }

  private formatarValor(valor: unknown): string {
    const numero = this.parseValor(valor);

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(numero);
  }

  private parseValor(valor: unknown): number {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor;
    }

    if (typeof valor === 'string') {
      const normalizado = valor.replace(',', '.').trim();
      const numero = Number(normalizado);
      if (Number.isFinite(numero)) {
        return numero;
      }
    }

    return 0;
  }
}
