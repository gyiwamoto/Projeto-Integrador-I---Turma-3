import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AgendaConsulta } from '../../interfaces/Agenda';
import {
  ConvenioResumo,
  FaturamentoPeriodo,
  GraficoFaturamentoItem,
  PeriodoFaturamento,
  ProcedimentoResumo,
  ProximaConsulta,
} from '../../interfaces/Dashboard';
import { PacienteItem } from '../../interfaces/Paciente';
import { ProcedimentoRealizadoItem } from '../../interfaces/ProcedimentoRealizado';
import { AgendaService } from '../../services/agenda.service';
import { AuthService } from '../../services/auth.service';
import { PacientesService } from '../../services/pacientes.service';
import {
  ListarProcedimentosRealizadosResponse,
  ProcedimentosRealizadosService,
} from '../../services/procedimentos-realizados.service';
import { TratamentoItem, TratamentosService } from '../../services/tratamentos.service';

Chart.register(...registerables);

function criarPeriodoFaturamentoVazio(): Record<PeriodoFaturamento, FaturamentoPeriodo> {
  return {
    mensal: { valor: 0, meta: 0, crescimento: 0 },
    trimestral: { valor: 0, meta: 0, crescimento: 0 },
    anual: { valor: 0, meta: 0, crescimento: 0 },
  };
}

function criarGraficoFaturamentoVazio(): Record<PeriodoFaturamento, GraficoFaturamentoItem[]> {
  return {
    mensal: [],
    trimestral: [],
    anual: [],
  };
}

function formatarMesAbreviado(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(data)
    .replace('.', '')
    .replace(/^./, (caractere) => caractere.toUpperCase());
}

function mesmaDataLocal(primeira: Date, segunda: Date): boolean {
  return (
    primeira.getFullYear() === segunda.getFullYear() &&
    primeira.getMonth() === segunda.getMonth() &&
    primeira.getDate() === segunda.getDate()
  );
}

function mesmoMesAno(primeira: Date, segunda: Date): boolean {
  return (
    primeira.getFullYear() === segunda.getFullYear() && primeira.getMonth() === segunda.getMonth()
  );
}

function converterValorMonetario(valor: string): number {
  const texto = String(valor ?? '').trim();

  if (!texto) {
    return 0;
  }

  if (texto.includes(',') && texto.includes('.')) {
    return Number.parseFloat(texto.replace(/\./g, '').replace(',', '.')) || 0;
  }

  if (texto.includes(',')) {
    return Number.parseFloat(texto.replace(',', '.')) || 0;
  }

  return Number.parseFloat(texto) || 0;
}

function calcularCrescimento(atual: number, anterior: number): number {
  if (anterior <= 0) {
    return atual > 0 ? 100 : 0;
  }

  return Math.round(((atual - anterior) / anterior) * 100);
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('faturamentoCanvas') private faturamentoCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly agendaService = inject(AgendaService);
  private readonly pacientesService = inject(PacientesService);
  private readonly procedimentosRealizadosService = inject(ProcedimentosRealizadosService);
  private readonly tratamentosService = inject(TratamentosService);

  carregandoDados = false;
  erroDados = '';

  consultasHoje = 0;
  confirmacoesHoje = 0;
  cancelamentosHoje = 0;
  pacientesAtivos = 0;
  pacientesNovosNoMes = 0;

  periodosFaturamento: Record<PeriodoFaturamento, FaturamentoPeriodo> =
    criarPeriodoFaturamentoVazio();
  graficoFaturamento: Record<PeriodoFaturamento, GraficoFaturamentoItem[]> =
    criarGraficoFaturamentoVazio();

  periodoFaturamentoSelecionado: PeriodoFaturamento = 'mensal';
  ocultarFaturamento = false;

  proximasConsultas: ProximaConsulta[] = [];
  procedimentosMaisRealizados: ProcedimentoResumo[] = [];
  conveniosUtilizados: ConvenioResumo[] = [];

  private faturamentoChart?: Chart<'line', number[], string>;

  ngOnInit(): void {
    this.carregarDashboard();
  }

  ngAfterViewInit(): void {
    this.criarOuAtualizarGraficoFaturamento();
  }

  ngOnDestroy(): void {
    this.faturamentoChart?.destroy();
  }

  get nomeUsuario(): string {
    return this.authService.obterSessaoAutenticada()?.nome ?? 'Equipe da clínica';
  }

  get percentualMetaAtingida(): number {
    const faturamento = this.faturamentoSelecionado;

    if (faturamento.meta <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((faturamento.valor / faturamento.meta) * 100));
  }

  get faturamentoSelecionado(): FaturamentoPeriodo {
    return this.periodosFaturamento[this.periodoFaturamentoSelecionado];
  }

  get faturamentoFormatado(): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      this.faturamentoSelecionado.valor,
    );
  }

  get metaFormatada(): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      this.faturamentoSelecionado.meta,
    );
  }

  get faturamentoExibido(): string {
    return this.ocultarFaturamento ? '••••••••••' : this.faturamentoFormatado;
  }

  get faturamentoSelecionadoExibido(): string {
    return this.ocultarFaturamento ? '••••••••••' : this.metaFormatada;
  }

  get crescimentoFaturamentoSelecionado(): string {
    const crescimento = this.faturamentoSelecionado.crescimento;
    return `${crescimento >= 0 ? '+' : ''}${crescimento}%`;
  }

  get metaResumoExibido(): string {
    return this.ocultarFaturamento
      ? '••••••••••••••'
      : `${this.percentualMetaAtingida}% da meta atingida`;
  }

  get crescimentoResumoExibido(): string {
    return this.ocultarFaturamento
      ? '••••••••••'
      : `${this.crescimentoFaturamentoSelecionado} no ${this.rotuloPeriodoFaturamento.toLowerCase()}`;
  }

  get graficoFaturamentoSelecionado(): GraficoFaturamentoItem[] {
    return this.graficoFaturamento[this.periodoFaturamentoSelecionado] ?? [];
  }

  get tituloGraficoFaturamento(): string {
    switch (this.periodoFaturamentoSelecionado) {
      case 'trimestral':
        return 'Evolucao trimestral';
      case 'anual':
        return 'Evolucao anual';
      default:
        return 'Evolucao mensal';
    }
  }

  get rotuloPeriodoFaturamento(): string {
    switch (this.periodoFaturamentoSelecionado) {
      case 'trimestral':
        return 'Trimestre';
      case 'anual':
        return 'Ano';
      default:
        return 'Mes';
    }
  }

  alternarOcultacaoFaturamento(): void {
    this.ocultarFaturamento = !this.ocultarFaturamento;
    this.criarOuAtualizarGraficoFaturamento();
  }

  aoMudarPeriodoFaturamento(periodo: PeriodoFaturamento): void {
    this.periodoFaturamentoSelecionado = periodo;
    this.criarOuAtualizarGraficoFaturamento();
  }

  private carregarDashboard(): void {
    this.carregandoDados = true;
    this.erroDados = '';

    forkJoin({
      consultas: this.agendaService
        .listarConsultas()
        .pipe(catchError(() => of([] as AgendaConsulta[]))),
      pacientes: this.pacientesService.listarPacientes().pipe(
        map((resposta) => resposta.pacientes ?? []),
        catchError(() => of([] as PacienteItem[])),
      ),
      procedimentos: this.procedimentosRealizadosService.listarProcedimentosRealizados().pipe(
        map((resposta) => this.mapearProcedimentosRealizados(resposta)),
        catchError(() => of([] as ProcedimentoRealizadoItem[])),
      ),
      tratamentos: this.tratamentosService.listarTratamentos().pipe(
        map((resposta) => resposta.tratamentos ?? []),
        catchError(() => of([] as TratamentoItem[])),
      ),
    }).subscribe({
      next: ({ consultas, pacientes, procedimentos, tratamentos }) => {
        this.aplicarDadosDashboard(consultas, pacientes, procedimentos, tratamentos);
        this.carregandoDados = false;
        this.cdr.markForCheck();
        this.criarOuAtualizarGraficoFaturamento();
      },
      error: () => {
        this.carregandoDados = false;
        this.erroDados = 'Nao foi possivel carregar os dados do dashboard.';
        this.cdr.markForCheck();
      },
    });
  }

  private aplicarDadosDashboard(
    consultas: AgendaConsulta[],
    pacientes: PacienteItem[],
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
  ): void {
    const agora = new Date();

    this.consultasHoje = consultas.filter((consulta) =>
      mesmaDataLocal(new Date(consulta.dataConsulta), agora),
    ).length;

    this.confirmacoesHoje = consultas.filter(
      (consulta) =>
        mesmaDataLocal(new Date(consulta.dataConsulta), agora) && consulta.status === 'realizado',
    ).length;

    this.cancelamentosHoje = consultas.filter(
      (consulta) =>
        mesmaDataLocal(new Date(consulta.dataConsulta), agora) && consulta.status === 'cancelado',
    ).length;

    this.pacientesAtivos = pacientes.length;
    this.pacientesNovosNoMes = pacientes.filter((paciente) =>
      mesmoMesAno(new Date(paciente.criadoEm), agora),
    ).length;

    this.proximasConsultas = this.montarProximasConsultas(consultas, agora);
    this.procedimentosMaisRealizados = this.montarProcedimentosMaisRealizados(procedimentos, agora);
    this.conveniosUtilizados = this.montarConveniosUtilizados(consultas, agora);

    this.periodosFaturamento = this.calcularPeriodosFaturamento(procedimentos, tratamentos, agora);
    this.graficoFaturamento = this.calcularGraficosFaturamento(procedimentos, tratamentos, agora);
  }

  private montarProximasConsultas(consultas: AgendaConsulta[], agora: Date): ProximaConsulta[] {
    return consultas
      .filter(
        (consulta) =>
          consulta.status === 'agendado' &&
          new Date(consulta.dataConsulta).getTime() >= agora.getTime(),
      )
      .sort(
        (primeira, segunda) =>
          new Date(primeira.dataConsulta).getTime() - new Date(segunda.dataConsulta).getTime(),
      )
      .slice(0, 3)
      .map((consulta) => {
        const dataConsulta = new Date(consulta.dataConsulta);

        return {
          id: consulta.id,
          horario: new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(dataConsulta),
          paciente: consulta.pacienteNome,
          dentista: consulta.profissionalNome,
          procedimento:
            consulta.observacoes?.trim() || consulta.convenioNome || 'Consulta agendada',
        };
      });
  }

  private montarProcedimentosMaisRealizados(
    procedimentos: ProcedimentoRealizadoItem[],
    agora: Date,
  ): ProcedimentoResumo[] {
    const procedimentosMes = procedimentos.filter((procedimento) =>
      mesmoMesAno(new Date(procedimento.dataProcedimento), agora),
    );
    const totalProcedimentos = procedimentosMes.length;
    const porNome = new Map<string, number>();

    for (const procedimento of procedimentosMes) {
      const nome = procedimento.tratamentoNome?.trim() || 'Tratamento';
      porNome.set(nome, (porNome.get(nome) ?? 0) + 1);
    }

    return Array.from(porNome.entries())
      .sort((primeiro, segundo) => segundo[1] - primeiro[1])
      .slice(0, 4)
      .map(([nome, total]) => ({
        nome,
        total,
        percentual: totalProcedimentos > 0 ? Math.round((total / totalProcedimentos) * 100) : 0,
      }));
  }

  private montarConveniosUtilizados(consultas: AgendaConsulta[], agora: Date): ConvenioResumo[] {
    const consultasMes = consultas.filter((consulta) =>
      mesmoMesAno(new Date(consulta.dataConsulta), agora),
    );
    const totalConsultas = consultasMes.length;
    const porConvenio = new Map<string, number>();

    for (const consulta of consultasMes) {
      const nome = consulta.convenioNome?.trim() || 'Particular';
      porConvenio.set(nome, (porConvenio.get(nome) ?? 0) + 1);
    }

    return Array.from(porConvenio.entries())
      .sort((primeiro, segundo) => segundo[1] - primeiro[1])
      .slice(0, 4)
      .map(([nome, consultas]) => ({
        nome,
        consultas,
        percentual: totalConsultas > 0 ? Math.round((consultas / totalConsultas) * 100) : 0,
      }));
  }

  private calcularPeriodosFaturamento(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    agora: Date,
  ): Record<PeriodoFaturamento, FaturamentoPeriodo> {
    const valorMensalAtual = this.calcularReceitaMes(
      procedimentos,
      tratamentos,
      agora.getFullYear(),
      agora.getMonth(),
    );
    const valorMensalAnterior = this.calcularReceitaMes(
      procedimentos,
      tratamentos,
      agora.getFullYear(),
      agora.getMonth() - 1,
    );

    const valorTrimestralAtual = this.calcularReceitaUltimosMeses(
      procedimentos,
      tratamentos,
      agora,
      3,
    );
    const valorTrimestralAnterior = this.calcularReceitaUltimosMeses(
      procedimentos,
      tratamentos,
      this.obterDataComMesDeslocado(agora, -3),
      3,
    );

    const valorAnualAtual = this.calcularReceitaAno(
      procedimentos,
      tratamentos,
      agora.getFullYear(),
    );
    const valorAnualAnterior = this.calcularReceitaAno(
      procedimentos,
      tratamentos,
      agora.getFullYear() - 1,
    );

    return {
      mensal: {
        valor: valorMensalAtual,
        meta: Math.max(Math.round(valorMensalAtual * 1.15), 1),
        crescimento: calcularCrescimento(valorMensalAtual, valorMensalAnterior),
      },
      trimestral: {
        valor: valorTrimestralAtual,
        meta: Math.max(Math.round(valorTrimestralAtual * 1.15), 1),
        crescimento: calcularCrescimento(valorTrimestralAtual, valorTrimestralAnterior),
      },
      anual: {
        valor: valorAnualAtual,
        meta: Math.max(Math.round(valorAnualAtual * 1.15), 1),
        crescimento: calcularCrescimento(valorAnualAtual, valorAnualAnterior),
      },
    };
  }

  private calcularGraficosFaturamento(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    agora: Date,
  ): Record<PeriodoFaturamento, GraficoFaturamentoItem[]> {
    return {
      mensal: this.montarSerieMensal(procedimentos, tratamentos, agora),
      trimestral: this.montarSerieTrimestral(procedimentos, tratamentos, agora),
      anual: this.montarSerieAnual(procedimentos, tratamentos, agora),
    };
  }

  private montarSerieMensal(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    agora: Date,
  ): GraficoFaturamentoItem[] {
    const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
    const valores = Array.from({ length: diasNoMes }, (_, indice) => ({
      rotulo: String(indice + 1),
      valor: 0,
    }));

    for (const procedimento of procedimentos) {
      const data = new Date(procedimento.dataProcedimento);
      if (data.getFullYear() !== agora.getFullYear() || data.getMonth() !== agora.getMonth()) {
        continue;
      }

      const indice = data.getDate() - 1;
      if (indice < 0 || indice >= valores.length) {
        continue;
      }

      const itemSerie = valores[indice];
      if (!itemSerie) {
        continue;
      }

      itemSerie.valor += this.obterValorTratamento(procedimento.tratamentoId, tratamentos);
    }

    return valores;
  }

  private montarSerieTrimestral(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    agora: Date,
  ): GraficoFaturamentoItem[] {
    const datas = [
      this.obterDataComMesDeslocado(agora, -2),
      this.obterDataComMesDeslocado(agora, -1),
      agora,
    ];

    return datas.map((data) => ({
      rotulo: formatarMesAbreviado(data),
      valor: this.calcularReceitaMes(
        procedimentos,
        tratamentos,
        data.getFullYear(),
        data.getMonth(),
      ),
    }));
  }

  private montarSerieAnual(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    agora: Date,
  ): GraficoFaturamentoItem[] {
    return Array.from({ length: 12 }, (_, indice) => ({
      rotulo: formatarMesAbreviado(new Date(agora.getFullYear(), indice, 1)),
      valor: this.calcularReceitaMes(procedimentos, tratamentos, agora.getFullYear(), indice),
    }));
  }

  private calcularReceitaAno(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    ano: number,
  ): number {
    return procedimentos
      .filter((procedimento) => new Date(procedimento.dataProcedimento).getFullYear() === ano)
      .reduce(
        (total, procedimento) =>
          total + this.obterValorTratamento(procedimento.tratamentoId, tratamentos),
        0,
      );
  }

  private calcularReceitaUltimosMeses(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    dataReferencia: Date,
    quantidadeMeses: number,
  ): number {
    const periodoInicial = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
    periodoInicial.setMonth(periodoInicial.getMonth() - (quantidadeMeses - 1));

    const periodoFinal = new Date(
      dataReferencia.getFullYear(),
      dataReferencia.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    return procedimentos
      .filter((procedimento) => {
        const data = new Date(procedimento.dataProcedimento);
        return (
          data.getTime() >= periodoInicial.getTime() && data.getTime() <= periodoFinal.getTime()
        );
      })
      .reduce(
        (total, procedimento) =>
          total + this.obterValorTratamento(procedimento.tratamentoId, tratamentos),
        0,
      );
  }

  private calcularReceitaMes(
    procedimentos: ProcedimentoRealizadoItem[],
    tratamentos: TratamentoItem[],
    ano: number,
    mes: number,
  ): number {
    return procedimentos
      .filter((procedimento) => {
        const data = new Date(procedimento.dataProcedimento);
        return data.getFullYear() === ano && data.getMonth() === mes;
      })
      .reduce(
        (total, procedimento) =>
          total + this.obterValorTratamento(procedimento.tratamentoId, tratamentos),
        0,
      );
  }

  private obterValorTratamento(tratamentoId: string, tratamentos: TratamentoItem[]): number {
    const tratamento = tratamentos.find((item) => item.id === tratamentoId);
    if (!tratamento) {
      return 0;
    }

    return converterValorMonetario(tratamento.valor);
  }

  private obterDataComMesDeslocado(data: Date, deslocamento: number): Date {
    return new Date(data.getFullYear(), data.getMonth() + deslocamento, 1);
  }

  private mapearProcedimentosRealizados(
    resposta: ListarProcedimentosRealizadosResponse,
  ): ProcedimentoRealizadoItem[] {
    return (resposta.procedimentos_realizados ?? []).map((item) => ({
      id: item.id,
      consultaId: item.consulta_id,
      tratamentoId: item.tratamento_id,
      tratamentoNome: item.tratamento_nome ?? 'Tratamento',
      dente: item.dente,
      face: item.face,
      dataProcedimento: item.data_procedimento,
      observacoes: item.observacoes ?? '',
      criadoEm: item.criado_em,
    }));
  }

  private criarOuAtualizarGraficoFaturamento(): void {
    const canvas = this.faturamentoCanvas?.nativeElement;

    if (!canvas) {
      return;
    }

    const items = this.graficoFaturamentoSelecionado;
    const labels = items.map((item) => item.rotulo);
    const values = items.map((item) => item.valor);
    const ocultar = this.ocultarFaturamento;

    const configuracao: ChartConfiguration<'line', number[], string> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Faturamento',
            data: values,
            borderColor: ocultar ? 'rgba(31, 111, 141, 0)' : '#1f6f8d',
            backgroundColor: ocultar ? 'rgba(0, 0, 0, 0)' : 'rgba(73, 168, 200, 0.18)',
            fill: !ocultar,
            showLine: !ocultar,
            tension: 0.35,
            pointRadius: ocultar ? 5 : 3,
            pointHoverRadius: ocultar ? 5 : 5,
            pointBackgroundColor: ocultar ? '#1f6f8d' : '#ffffff',
            pointBorderColor: '#1f6f8d',
            pointBorderWidth: ocultar ? 0 : 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(context.parsed.y ?? 0),
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#6d8399',
              maxRotation: 0,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(18, 34, 54, 0.08)',
            },
            ticks: {
              color: '#6d8399',
              callback: (value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                }).format(Number(value)),
            },
          },
        },
      },
    };

    if (this.faturamentoChart) {
      this.faturamentoChart.data = configuracao.data;
      this.faturamentoChart.options = configuracao.options!;
      this.faturamentoChart.update();
      return;
    }

    this.faturamentoChart = new Chart(canvas, configuracao);
  }
}
