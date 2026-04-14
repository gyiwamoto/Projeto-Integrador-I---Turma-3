import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROCEDIMENTOS_FIXOS } from '../../constants/procedimentos';
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
import { AuthService } from '../../services/auth.service';
import { ProcedimentosRealizadosService } from '../../services/procedimentos-realizados.service';
import { ToastService } from '../../services/toast.service';
import { dentes, faces } from '../../constants/odontograma';
import { formatarData, formatarDataHora } from '../../utils/formatar-data';
import { formatarStatusConsulta } from '../../utils/enums-status';
import { formatarTextoCurto } from '../../utils/formatar-texto';

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
  private readonly authService = inject(AuthService);
  private readonly procedimentosRealizadosService = inject(ProcedimentosRealizadosService);
  private readonly toastService = inject(ToastService);

  readonly dentesOdontograma = dentes;
  readonly facesOdontograma = faces;
  readonly procedimentosFixos = PROCEDIMENTOS_FIXOS;

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
      formatador: (valor) => formatarTextoCurto(valor),
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
    dataProcedimento: [this.obterDataProcedimentoPadrao(), [Validators.required]],
    observacoes: [''],
  });

  readonly formSenhaFinalizacao = this.fb.nonNullable.group({
    senhaAtual: ['', [Validators.required, Validators.minLength(6)]],
  });

  filtros: Record<string, string> = {};
  carregandoConsultas = false;
  carregandoProcedimentos = false;
  salvandoProcedimento = false;
  finalizandoConsulta = false;
  confirmandoSenhaFinalizacao = false;
  mostraModalSenhaFinalizacao = false;
  mostrarSenhaAtualFinalizacao = false;

  consultas: AgendaConsulta[] = [];
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
        this.fecharDetalheConsulta();
        return;
      }
      this.selecionarConsulta(consulta);
    }
  };

  fecharDetalheConsulta(): void {
    this.consultaSelecionada = null;
    this.procedimentosConsultaSelecionada = [];
    this.carregandoProcedimentos = false;
    this.formProcedimento.reset({
      tratamentoId: '',
      dente: '11',
      face: 'V',
      dataProcedimento: this.obterDataProcedimentoPadrao(),
      observacoes: '',
    });
  }

  selecionarConsulta(consulta: AgendaConsulta): void {
    this.consultaSelecionada = consulta;
    this.formProcedimento.reset({
      tratamentoId: '',
      dente: '11',
      face: 'V',
      dataProcedimento: this.obterDataProcedimentoPadrao(),
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
        ? formatarData(valor.dataProcedimento, 'backend')
        : formatarData(new Date(), 'backend'),
      observacoes: (valor.observacoes ?? '').trim(),
    };

    this.salvandoProcedimento = true;
    this.procedimentosRealizadosService.criarProcedimento(payload).subscribe({
      next: () => {
        this.salvandoProcedimento = false;
        this.toastService.sucesso('Procedimento registrado com sucesso.');
        this.formProcedimento.patchValue({
          dataProcedimento: this.obterDataProcedimentoPadrao(),
          observacoes: '',
        });
        this.carregarProcedimentosDaConsulta(this.consultaSelecionada?.id ?? '');
      },
      error: (error: Error) => {
        this.salvandoProcedimento = false;
        this.toastService.erro(error.message || 'Nao foi possivel registrar o procedimento.');
      },
    });
  }

  abrirModalSenhaFinalizacao(): void {
    if (!this.consultaSelecionada) {
      return;
    }

    if (!this.podeFinalizarConsulta) {
      return;
    }

    this.formSenhaFinalizacao.reset({ senhaAtual: '' });
    this.mostrarSenhaAtualFinalizacao = false;
    this.mostraModalSenhaFinalizacao = true;
  }

  fecharModalSenhaFinalizacao(): void {
    if (this.confirmandoSenhaFinalizacao) {
      return;
    }

    this.mostraModalSenhaFinalizacao = false;
    this.formSenhaFinalizacao.reset({ senhaAtual: '' });
    this.mostrarSenhaAtualFinalizacao = false;
  }

  alternarVisualizacaoSenhaFinalizacao(): void {
    this.mostrarSenhaAtualFinalizacao = !this.mostrarSenhaAtualFinalizacao;
  }

  confirmarFinalizacaoComSenha(): void {
    if (!this.consultaSelecionada) {
      return;
    }

    if (this.formSenhaFinalizacao.invalid) {
      this.formSenhaFinalizacao.markAllAsTouched();
      this.toastService.erro('Digite sua senha atual para confirmar a finalizacao.');
      return;
    }

    const sessao = this.authService.obterSessaoAutenticada();
    if (!sessao?.email) {
      this.toastService.erro('Nao foi possivel validar sua sessao. Faca login novamente.');
      return;
    }

    const { senhaAtual } = this.formSenhaFinalizacao.getRawValue();
    this.confirmandoSenhaFinalizacao = true;

    this.authService.login(sessao.email, senhaAtual).subscribe({
      next: () => {
        this.confirmandoSenhaFinalizacao = false;
        this.mostraModalSenhaFinalizacao = false;
        this.formSenhaFinalizacao.reset({ senhaAtual: '' });
        this.mostrarSenhaAtualFinalizacao = false;
        this.finalizarConsulta();
      },
      error: (error: Error) => {
        this.confirmandoSenhaFinalizacao = false;
        this.toastService.erro(error.message || 'Senha atual invalida.');
      },
    });
  }

  private finalizarConsulta(): void {
    if (!this.consultaSelecionada) {
      return;
    }

    this.finalizandoConsulta = true;
    this.agendaService.atualizarStatusConsulta(this.consultaSelecionada.id, 'realizado').subscribe({
      next: () => {
        this.finalizandoConsulta = false;
        this.fecharModalSenhaFinalizacao();
        this.fecharDetalheConsulta();
        this.toastService.sucesso('Consulta marcada como realizada.');
        this.carregarConsultas();
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
    this.consultaSelecionada = null;
    this.procedimentosConsultaSelecionada = [];

    this.agendaService.listarConsultas(false, 'atendimento').subscribe({
      next: (consultas) => {
        this.consultas = consultas;
        this.carregandoConsultas = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.carregandoConsultas = false;
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
    return formatarStatusConsulta(status);
  }

  private ehConsultaDoDiaPendente(consulta: AgendaConsulta): boolean {
    if (consulta.status !== 'agendado') {
      return false;
    }

    return formatarData(consulta.dataConsulta, 'input') === formatarData(new Date(), 'input');
  }

  private obterDataProcedimentoPadrao(): string {
    return formatarDataHora(new Date(), 'input');
  }
}
