import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';
import { AgendaConsulta } from '../../interfaces/Agenda';
import {
  ProcedimentoRealizadoItem,
  SalvarProcedimentoRealizadoPayload,
} from '../../interfaces/ProcedimentoRealizado';
import { AgendaService } from '../../services/agenda.service';
import { TratamentoItem, TratamentosService } from '../../services/tratamentos.service';
import { ProcedimentosRealizadosService } from '../../services/procedimentos-realizados.service';
import { ToastService } from '../../services/toast.service';
import { dentes, faces } from '../../utils/odontograma';
import { formatarData } from '../../utils/formatar-data';

interface ConsultaAtendimentoLinha extends TabelaLinha {
  id: string;
  dataConsulta: string;
  pacienteNome: string;
  codigoPaciente: string;
  profissionalNome: string;
  status: string;
  observacoes: string;
}

@Component({
  selector: 'app-atendimento',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TabelaComponent],
  templateUrl: './atendimento.component.html',
  styleUrl: './atendimento.component.scss',
})
export class AtendimentoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly agendaService = inject(AgendaService);
  private readonly tratamentosService = inject(TratamentosService);
  private readonly procedimentosRealizadosService = inject(ProcedimentosRealizadosService);
  private readonly toastService = inject(ToastService);

  readonly dentesOdontograma = dentes;
  readonly facesOdontograma = faces;

  readonly colunasConsultas: TabelaColuna[] = [
    {
      chave: 'dataConsulta',
      titulo: 'Data',
      formatador: (valor) => formatarData(valor),
    },
    { chave: 'pacienteNome', titulo: 'Paciente' },
    { chave: 'codigoPaciente', titulo: 'Codigo' },
    { chave: 'profissionalNome', titulo: 'Dentista' },
    { chave: 'status', titulo: 'Status' },
    {
      chave: 'observacoes',
      titulo: 'Observacoes',
      formatador: (valor) => this.formatarTextoCurto(valor),
    },
  ];

  readonly colunasProcedimentos: TabelaColuna[] = [
    {
      chave: 'dataProcedimento',
      titulo: 'Data',
      formatador: (valor) => formatarData(valor),
    },
    { chave: 'tratamentoNome', titulo: 'Procedimento' },
    { chave: 'dente', titulo: 'Dente' },
    { chave: 'face', titulo: 'Face' },
    { chave: 'observacoes', titulo: 'Observacoes' },
  ];

  readonly formProcedimento = this.fb.group({
    tratamentoId: ['', [Validators.required]],
    dente: ['11', [Validators.required]],
    face: ['V', [Validators.required]],
    dataProcedimento: ['', [Validators.required]],
    observacoes: [''],
  });

  filtros: Record<string, string> = {};
  carregandoConsultas = false;
  carregandoTratamentos = false;
  carregandoProcedimentos = false;
  salvandoProcedimento = false;
  finalizandoConsulta = false;

  consultas: AgendaConsulta[] = [];
  tratamentos: TratamentoItem[] = [];
  procedimentosConsultaSelecionada: ProcedimentoRealizadoItem[] = [];
  consultaSelecionada: AgendaConsulta | null = null;

  ngOnInit(): void {
    this.carregarDadosIniciais();
  }

  get consultasFiltradas(): ConsultaAtendimentoLinha[] {
    return this.consultas
      .filter((consulta) => {
        return this.ehConsultaDoDiaPendente(consulta);
      })
      .map((consulta) => ({
        id: consulta.id,
        dataConsulta: consulta.dataConsulta,
        pacienteNome: consulta.pacienteNome,
        codigoPaciente: consulta.codigoPaciente ?? '-',
        profissionalNome: consulta.profissionalNome,
        status: this.formatarStatus(consulta.status),
        observacoes: consulta.observacoes ?? '',
      }));
  }

  get linhasConsultas(): TabelaLinha[] {
    return this.consultasFiltradas as unknown as TabelaLinha[];
  }

  get procedimentosSelecionados(): ProcedimentoRealizadoItem[] {
    return this.procedimentosConsultaSelecionada;
  }

  get podeAdicionarProcedimento(): boolean {
    return Boolean(this.consultaSelecionada) && this.consultaSelecionada?.status !== 'cancelado';
  }

  get podeFinalizarConsulta(): boolean {
    return Boolean(this.consultaSelecionada) && this.consultaSelecionada?.status === 'agendado';
  }

  readonly acaoSelecionarConsulta = (linha: TabelaLinha): void => {
    const consulta = this.consultas.find((item) => item.id === linha['id']);
    if (consulta) {
      if (this.consultaSelecionada?.id === consulta.id) {
        this.consultaSelecionada = null;
        this.procedimentosConsultaSelecionada = [];
        this.carregandoProcedimentos = false;
        return;
      }
      this.selecionarConsulta(consulta);
    }
  };

  selecionarConsulta(consulta: AgendaConsulta): void {
    this.consultaSelecionada = consulta;
    this.formProcedimento.reset({
      tratamentoId: '',
      dente: '11',
      face: 'V',
      observacoes: '',
    });
    this.carregarProcedimentosDaConsulta(consulta.id);
  }

  salvarProcedimento(): void {
    if (!this.consultaSelecionada || this.formProcedimento.invalid) {
      this.formProcedimento.markAllAsTouched();
      return;
    }

    if (this.consultaSelecionada.status === 'cancelado') {
      this.toastService.erro('Nao e possivel registrar procedimentos em uma consulta cancelada.');
      return;
    }

    const valor = this.formProcedimento.getRawValue();
    const payload: SalvarProcedimentoRealizadoPayload = {
      consultaId: this.consultaSelecionada.id,
      tratamentoId: valor.tratamentoId ?? '',
      dente: Number(valor.dente),
      face: (valor.face ?? '').toUpperCase(),
      dataProcedimento: valor.dataProcedimento?.trim()
        ? new Date(valor.dataProcedimento).toISOString()
        : this.obterDataAtualIso(),
      observacoes: (valor.observacoes ?? '').trim(),
    };

    this.salvandoProcedimento = true;
    this.procedimentosRealizadosService.criarProcedimento(payload).subscribe({
      next: () => {
        this.salvandoProcedimento = false;
        this.toastService.sucesso('Procedimento registrado com sucesso.');
        this.formProcedimento.patchValue({ observacoes: '' });
        this.carregarProcedimentosDaConsulta(this.consultaSelecionada?.id ?? '');
      },
      error: (error: Error) => {
        this.salvandoProcedimento = false;
        this.toastService.erro(error.message || 'Nao foi possivel registrar o procedimento.');
      },
    });
  }

  finalizarConsulta(): void {
    if (!this.consultaSelecionada) {
      return;
    }

    this.finalizandoConsulta = true;
    this.agendaService.atualizarStatusConsulta(this.consultaSelecionada.id, 'realizado').subscribe({
      next: () => {
        this.finalizandoConsulta = false;
        this.toastService.sucesso('Consulta marcada como realizada.');
        this.carregarConsultas(this.consultaSelecionada?.id ?? undefined);
      },
      error: (error: Error) => {
        this.finalizandoConsulta = false;
        this.toastService.erro(error.message || 'Nao foi possivel finalizar a consulta.');
      },
    });
  }

  possuiProcedimentoNoDenteFace(dente: number, faceCodigo: string): boolean {
    return this.procedimentosConsultaSelecionada.some(
      (procedimento) => procedimento.dente === dente && procedimento.face === faceCodigo,
    );
  }

  irParaConsultaSelecionada(): void {
    if (!this.consultaSelecionada) {
      return;
    }

    void this.router.navigate(['/dashboard/pacientes'], {
      queryParams: { consultaId: this.consultaSelecionada.id },
    });
  }

  private carregarDadosIniciais(): void {
    this.carregandoConsultas = true;
    this.carregandoTratamentos = true;
    this.consultaSelecionada = null;
    this.procedimentosConsultaSelecionada = [];

    forkJoin({
      consultas: this.agendaService.listarConsultas(false, 'atendimento'),
      tratamentos: this.tratamentosService.listarTratamentos(),
    }).subscribe({
      next: ({ consultas, tratamentos }) => {
        this.consultas = consultas;
        this.tratamentos = tratamentos.tratamentos;
        this.carregandoConsultas = false;
        this.carregandoTratamentos = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.carregandoConsultas = false;
        this.carregandoTratamentos = false;
        this.toastService.erro(
          error.message || 'Nao foi possivel carregar os dados do atendimento.',
        );
        this.cdr.markForCheck();
      },
    });
  }

  private carregarConsultas(consultaIdSelecionada?: string): void {
    this.carregandoConsultas = true;

    this.agendaService.listarConsultas(false, 'atendimento').subscribe({
      next: (consultas) => {
        this.consultas = consultas;
        this.carregandoConsultas = false;
        if (consultaIdSelecionada) {
          const consulta = this.consultas.find((item) => item.id === consultaIdSelecionada);
          if (consulta) {
            this.consultaSelecionada = consulta;
          }
        }
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.carregandoConsultas = false;
        this.toastService.erro(error.message || 'Nao foi possivel carregar as consultas.');
        this.cdr.markForCheck();
      },
    });
  }

  private carregarProcedimentosDaConsulta(consultaId: string): void {
    if (!consultaId) {
      this.procedimentosConsultaSelecionada = [];
      return;
    }

    this.carregandoProcedimentos = true;
    this.procedimentosRealizadosService.listarPorConsulta(consultaId).subscribe({
      next: (procedimentos) => {
        this.procedimentosConsultaSelecionada = procedimentos;
        this.carregandoProcedimentos = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.procedimentosConsultaSelecionada = [];
        this.carregandoProcedimentos = false;
        this.toastService.erro(
          error.message || 'Nao foi possivel carregar os procedimentos da consulta.',
        );
        this.cdr.markForCheck();
      },
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

  private formatarTextoCurto(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      return '-';
    }

    const texto = valor.trim();
    return texto.length > 42 ? `${texto.slice(0, 42)}...` : texto;
  }

  private apenasData(valor: string): string {
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      return '';
    }

    return data.toISOString().slice(0, 10);
  }

  private obterDataAtualIso(): string {
    const data = new Date();
    return data.toISOString().slice(0, 10);
  }

  private ehConsultaDoDiaPendente(consulta: AgendaConsulta): boolean {
    if (consulta.status !== 'agendado') {
      return false;
    }

    return this.apenasData(consulta.dataConsulta) === this.obterDataAtualIso();
  }
}
