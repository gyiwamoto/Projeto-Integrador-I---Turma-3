import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';
import { AgendaConsulta } from '../../interfaces/Agenda';
import { ConvenioItem } from '../../interfaces/Convenio';
import {
  ProcedimentoRealizadoItem,
  SalvarProcedimentoRealizadoPayload,
} from '../../interfaces/ProcedimentoRealizado';
import { AgendaService } from '../../services/agenda.service';
import { AuthService } from '../../services/auth.service';
import { ConveniosService } from '../../services/convenios.service';
import { ProcedimentosRealizadosService } from '../../services/procedimentos-realizados.service';
import { ToastService } from '../../services/toast.service';
import { TratamentoItem, TratamentosService } from '../../services/tratamentos.service';
import { formatarData } from '../../utils/formatar-data';

interface ConsultaLinha extends TabelaLinha {
  id: string;
  dataConsulta: string;
  pacienteNome: string;
  codigoPaciente: string;
  convenioNome: string;
  numeroCarteirinha: string;
  profissionalNome: string;
  status: string;
  observacoes: string;
}

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TabelaComponent, FiltrosComponent],
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.scss',
})
export class ConsultasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly agendaService = inject(AgendaService);
  private readonly authService = inject(AuthService);
  private readonly conveniosService = inject(ConveniosService);
  private readonly tratamentosService = inject(TratamentosService);
  private readonly procedimentosRealizadosService = inject(ProcedimentosRealizadosService);
  private readonly toastService = inject(ToastService);

  readonly colunas: TabelaColuna[] = [
    { chave: 'codigoPaciente', titulo: 'Codigo' },
    { chave: 'pacienteNome', titulo: 'Paciente' },
    { chave: 'convenioNome', titulo: 'Convenio' },
    { chave: 'numeroCarteirinha', titulo: 'Carteirinha' },
    { chave: 'profissionalNome', titulo: 'Profissional' },
    { chave: 'dataConsulta', titulo: 'Data', formatador: (valor) => formatarData(valor) },
    { chave: 'status', titulo: 'Status' },
  ];

  readonly camposFiltro: FiltroCampo[] = [
    {
      key: 'paciente',
      label: 'Paciente',
      type: 'text',
      placeholder: 'Nome, codigo ou carteirinha',
    },
    { key: 'inicio', label: 'Data inicial', type: 'date' },
    { key: 'fim', label: 'Data final', type: 'date' },
  ];

  readonly colunasProcedimentos: TabelaColuna[] = [
    { chave: 'dataProcedimento', titulo: 'Data', formatador: (valor) => formatarData(valor) },
    { chave: 'tratamentoNome', titulo: 'Procedimento' },
    { chave: 'dente', titulo: 'Dente' },
    { chave: 'face', titulo: 'Face' },
    { chave: 'observacoes', titulo: 'Observacoes' },
  ];

  carregando = false;
  carregandoProcedimentos = false;
  carregandoConvenios = false;
  carregandoTratamentos = false;
  salvandoConsulta = false;
  salvandoProcedimento = false;
  excluindoConsulta = false;
  excluindoProcedimento = false;

  linhas: ConsultaLinha[] = [];
  linhasFiltradas: ConsultaLinha[] = [];
  filtros: Record<string, string> = {};
  consultas: AgendaConsulta[] = [];
  convenios: ConvenioItem[] = [];
  tratamentos: TratamentoItem[] = [];
  consultaSelecionada: AgendaConsulta | null = null;
  procedimentoSelecionado: ProcedimentoRealizadoItem | null = null;
  procedimentosConsultaSelecionada: ProcedimentoRealizadoItem[] = [];

  readonly formConsulta = this.fb.group({
    dataConsulta: ['', [Validators.required]],
    status: ['agendado', [Validators.required]],
    numeroCarteirinha: [''],
    convenioId: [''],
    observacoes: [''],
  });

  readonly formProcedimento = this.fb.group({
    tratamentoId: ['', [Validators.required]],
    dente: ['11', [Validators.required]],
    face: ['V', [Validators.required]],
    dataProcedimento: ['', [Validators.required]],
    observacoes: [''],
  });

  readonly acaoSelecionarConsulta = (linha: TabelaLinha): void => {
    const consulta = this.consultas.find((item) => item.id === String(linha['id'] ?? ''));
    if (consulta) {
      this.selecionarConsulta(consulta);
    }
  };

  readonly acaoEditarProcedimento = (linha: TabelaLinha): void => {
    const procedimento = this.procedimentosConsultaSelecionada.find(
      (item) => item.id === String(linha['id'] ?? ''),
    );
    if (procedimento) {
      this.selecionarProcedimento(procedimento);
    }
  };

  readonly acaoExcluirProcedimento = (linha: TabelaLinha): void => {
    const procedimento = this.procedimentosConsultaSelecionada.find(
      (item) => item.id === String(linha['id'] ?? ''),
    );
    if (!procedimento) {
      return;
    }

    const confirmacao = confirm('Deseja excluir este procedimento?');
    if (!confirmacao) {
      return;
    }

    this.excluirProcedimento(procedimento.id);
  };

  readonly excluirDesabilitadoProcedimento = (): boolean => this.excluindoProcedimento;

  get ehAdmin(): boolean {
    return this.authService.ehAdmin();
  }

  get linhasConsultas(): TabelaLinha[] {
    return this.linhasFiltradas as unknown as TabelaLinha[];
  }

  get procedimentosSelecionados(): TabelaLinha[] {
    return this.procedimentosConsultaSelecionada as unknown as TabelaLinha[];
  }

  ngOnInit(): void {
    this.carregarDados();
    this.carregarConvenios();
    this.carregarTratamentos();
  }

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtros = filtros;
    this.aplicarFiltros();
  }

  selecionarConsulta(consulta: AgendaConsulta): void {
    this.consultaSelecionada = consulta;
    this.procedimentoSelecionado = null;
    this.formConsulta.reset({
      dataConsulta: this.converterIsoParaDateTimeLocal(consulta.dataConsulta),
      status: consulta.status,
      numeroCarteirinha: consulta.numeroCarteirinha ?? '',
      convenioId: consulta.convenioId ?? '',
      observacoes: consulta.observacoes ?? '',
    });
    this.formProcedimento.reset({
      tratamentoId: '',
      dente: '11',
      face: 'V',
      dataProcedimento: '',
      observacoes: '',
    });
    this.carregarProcedimentosConsulta(consulta.id);
  }

  deseleccionarConsulta(): void {
    this.consultaSelecionada = null;
    this.procedimentoSelecionado = null;
    this.procedimentosConsultaSelecionada = [];
    this.carregandoProcedimentos = false;
    this.formConsulta.reset({
      dataConsulta: '',
      status: 'agendado',
      numeroCarteirinha: '',
      convenioId: '',
      observacoes: '',
    });
    this.formProcedimento.reset({
      tratamentoId: '',
      dente: '11',
      face: 'V',
      dataProcedimento: '',
      observacoes: '',
    });
  }

  selecionarProcedimento(procedimento: ProcedimentoRealizadoItem): void {
    this.procedimentoSelecionado = procedimento;
    this.formProcedimento.reset({
      tratamentoId: procedimento.tratamentoId,
      dente: procedimento.dente != null ? String(procedimento.dente) : '11',
      face: procedimento.face ?? 'V',
      dataProcedimento: this.converterIsoParaDateTimeLocal(procedimento.dataProcedimento),
      observacoes: procedimento.observacoes ?? '',
    });
  }

  cancelarEdicaoProcedimento(): void {
    this.procedimentoSelecionado = null;
    this.formProcedimento.reset({
      tratamentoId: '',
      dente: '11',
      face: 'V',
      dataProcedimento: '',
      observacoes: '',
    });
  }

  salvarConsulta(): void {
    if (!this.consultaSelecionada || this.formConsulta.invalid) {
      this.formConsulta.markAllAsTouched();
      return;
    }

    const valor = this.formConsulta.getRawValue();
    const dataConsultaIso = this.converterDateTimeLocalParaIso(valor.dataConsulta ?? '');
    if (!dataConsultaIso) {
      this.toastService.erro('Data da consulta invalida.');
      return;
    }

    this.salvandoConsulta = true;
    this.agendaService
      .atualizarConsulta(this.consultaSelecionada.id, {
        status: (valor.status as AgendaConsulta['status']) ?? 'agendado',
        dataConsulta: dataConsultaIso,
        numeroCarteirinha: (valor.numeroCarteirinha ?? '').trim(),
        convenioId: (valor.convenioId ?? '').trim() || undefined,
        observacoes: (valor.observacoes ?? '').trim(),
      })
      .subscribe({
        next: (resposta) => {
          this.salvandoConsulta = false;
          this.toastService.sucesso(resposta.mensagem || 'Consulta atualizada com sucesso.');
          this.sincronizarConsultasComCache();
        },
        error: (erro: Error) => {
          this.salvandoConsulta = false;
          this.toastService.erro(erro.message || 'Nao foi possivel atualizar a consulta.');
          this.cdr.markForCheck();
        },
      });
  }

  excluirConsulta(): void {
    if (!this.consultaSelecionada || !this.ehAdmin) {
      return;
    }

    const confirmacao = confirm(
      `Deseja excluir a consulta de ${this.consultaSelecionada.pacienteNome}?`,
    );
    if (!confirmacao) {
      return;
    }

    this.excluindoConsulta = true;
    this.agendaService.excluirConsulta(this.consultaSelecionada.id).subscribe({
      next: (resposta) => {
        this.excluindoConsulta = false;
        this.toastService.sucesso(resposta.mensagem || 'Consulta excluida com sucesso.');
        this.deseleccionarConsulta();
        this.sincronizarConsultasComCache();
      },
      error: (erro: Error) => {
        this.excluindoConsulta = false;
        this.toastService.erro(erro.message || 'Nao foi possivel excluir a consulta.');
        this.cdr.markForCheck();
      },
    });
  }

  salvarProcedimento(): void {
    if (!this.consultaSelecionada || this.formProcedimento.invalid) {
      this.formProcedimento.markAllAsTouched();
      return;
    }

    const valor = this.formProcedimento.getRawValue();
    const payload: SalvarProcedimentoRealizadoPayload = {
      consultaId: this.consultaSelecionada.id,
      tratamentoId: valor.tratamentoId ?? '',
      dente: Number(valor.dente),
      face: (valor.face ?? '').toUpperCase(),
      dataProcedimento:
        this.converterDateTimeLocalParaIso(valor.dataProcedimento ?? '') ??
        this.obterDataAtualIso(),
      observacoes: (valor.observacoes ?? '').trim(),
    };

    if (this.procedimentoSelecionado) {
      this.atualizarProcedimento(this.procedimentoSelecionado.id, payload);
      return;
    }

    this.salvandoProcedimento = true;
    this.procedimentosRealizadosService.criarProcedimento(payload).subscribe({
      next: () => {
        this.salvandoProcedimento = false;
        this.toastService.sucesso('Procedimento registrado com sucesso.');
        this.cancelarEdicaoProcedimento();
        this.carregarProcedimentosConsulta(this.consultaSelecionada?.id ?? '');
      },
      error: (erro: Error) => {
        this.salvandoProcedimento = false;
        this.toastService.erro(erro.message || 'Nao foi possivel registrar o procedimento.');
        this.cdr.markForCheck();
      },
    });
  }

  private atualizarProcedimento(
    procedimentoId: string,
    payload: SalvarProcedimentoRealizadoPayload,
  ): void {
    this.salvandoProcedimento = true;
    this.procedimentosRealizadosService
      .atualizarProcedimento(procedimentoId, {
        tratamentoId: payload.tratamentoId,
        dente: payload.dente,
        face: payload.face,
        dataProcedimento: payload.dataProcedimento,
        observacoes: payload.observacoes,
      })
      .subscribe({
        next: () => {
          this.salvandoProcedimento = false;
          this.toastService.sucesso('Procedimento atualizado com sucesso.');
          this.cancelarEdicaoProcedimento();
          this.carregarProcedimentosConsulta(this.consultaSelecionada?.id ?? '');
        },
        error: (erro: Error) => {
          this.salvandoProcedimento = false;
          this.toastService.erro(erro.message || 'Nao foi possivel atualizar o procedimento.');
          this.cdr.markForCheck();
        },
      });
  }

  private excluirProcedimento(procedimentoId: string): void {
    this.excluindoProcedimento = true;
    this.procedimentosRealizadosService.excluirProcedimento(procedimentoId).subscribe({
      next: () => {
        this.excluindoProcedimento = false;
        this.toastService.sucesso('Procedimento excluido com sucesso.');
        this.cancelarEdicaoProcedimento();
        this.carregarProcedimentosConsulta(this.consultaSelecionada?.id ?? '');
      },
      error: (erro: Error) => {
        this.excluindoProcedimento = false;
        this.toastService.erro(erro.message || 'Nao foi possivel excluir o procedimento.');
        this.cdr.markForCheck();
      },
    });
  }

  private carregarDados(): void {
    this.carregando = true;
    this.agendaService.listarConsultas().subscribe({
      next: (consultas) => {
        this.consultas = consultas ?? [];
        this.linhas = this.montarLinhas(this.consultas);
        this.aplicarFiltros();
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (erro: Error) => {
        this.carregando = false;
        this.toastService.erro(erro.message || 'Nao foi possivel carregar as consultas.');
        this.cdr.markForCheck();
      },
    });
  }

  private sincronizarConsultasComCache(): void {
    this.consultas = this.agendaService.obterConsultasEmCache('geral');
    this.linhas = this.montarLinhas(this.consultas);
    this.aplicarFiltros();
    this.cdr.markForCheck();
  }

  private carregarConvenios(): void {
    this.carregandoConvenios = true;
    this.conveniosService.listarConvenios().subscribe({
      next: (resposta) => {
        this.convenios = resposta.convenios ?? [];
        this.carregandoConvenios = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.convenios = [];
        this.carregandoConvenios = false;
        this.cdr.markForCheck();
      },
    });
  }

  private carregarTratamentos(): void {
    this.carregandoTratamentos = true;
    this.tratamentosService.listarTratamentos().subscribe({
      next: (resposta) => {
        this.tratamentos = resposta.tratamentos ?? [];
        this.carregandoTratamentos = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.tratamentos = [];
        this.carregandoTratamentos = false;
        this.cdr.markForCheck();
      },
    });
  }

  private carregarProcedimentosConsulta(consultaId: string): void {
    if (!consultaId) {
      this.procedimentosConsultaSelecionada = [];
      return;
    }

    this.carregandoProcedimentos = true;
    this.procedimentosRealizadosService.listarPorConsulta(consultaId).subscribe({
      next: (procedimentos) => {
        this.procedimentosConsultaSelecionada = procedimentos ?? [];
        this.carregandoProcedimentos = false;
        this.cdr.markForCheck();
      },
      error: (erro: Error) => {
        this.procedimentosConsultaSelecionada = [];
        this.carregandoProcedimentos = false;
        this.toastService.erro(
          erro.message || 'Nao foi possivel carregar os procedimentos da consulta.',
        );
        this.cdr.markForCheck();
      },
    });
  }

  private montarLinhas(consultas: AgendaConsulta[]): ConsultaLinha[] {
    return consultas.map((consulta) => ({
      id: consulta.id,
      dataConsulta: consulta.dataConsulta,
      pacienteNome: consulta.pacienteNome,
      codigoPaciente: consulta.codigoPaciente ?? '-',
      convenioNome: consulta.convenioNome ?? '-',
      numeroCarteirinha: consulta.numeroCarteirinha ?? '-',
      profissionalNome: consulta.profissionalNome,
      status: this.formatarStatus(consulta.status),
      observacoes: consulta.observacoes ?? '',
    }));
  }

  private aplicarFiltros(): void {
    const inicio = (this.filtros['inicio'] ?? '').trim();
    const fim = (this.filtros['fim'] ?? '').trim();
    const paciente = (this.filtros['paciente'] ?? '').trim().toLowerCase();

    this.linhasFiltradas = this.linhas.filter((linha) => {
      const dataLinha = this.apenasData(linha.dataConsulta);
      const passouInicio = !inicio || dataLinha >= inicio;
      const passouFim = !fim || dataLinha <= fim;
      const alvoPaciente = [linha.pacienteNome, linha.codigoPaciente, linha.numeroCarteirinha]
        .join(' ')
        .toLowerCase();
      const passouPaciente = !paciente || alvoPaciente.includes(paciente);
      return passouInicio && passouFim && passouPaciente;
    });
  }

  private formatarStatus(status: AgendaConsulta['status']): string {
    if (status === 'agendado') {
      return 'Agendado';
    }

    if (status === 'realizado') {
      return 'Realizado';
    }

    return 'Cancelado';
  }

  private apenasData(valor: string): string {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      return '';
    }

    return data.toISOString().slice(0, 10);
  }

  private converterIsoParaDateTimeLocal(valor: string): string {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      return '';
    }

    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');

    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
  }

  private converterDateTimeLocalParaIso(valor: string): string | null {
    const texto = valor.trim();
    if (!texto) {
      return null;
    }

    const data = new Date(texto);
    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return data.toISOString();
  }

  private obterDataAtualIso(): string {
    return new Date().toISOString();
  }
}
