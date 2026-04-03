import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import {
  ConvenioResumo,
  FaturamentoPeriodo,
  GraficoFaturamentoItem,
  PeriodoFaturamento,
  ProcedimentoResumo,
  ProximaConsulta,
} from '../../interfaces/Dashboard';
import { AuthService } from '../../services/auth.service';

Chart.register(...registerables);

function gerarSerieFaturamento(
  rotulos: string[],
  base: number,
  incremento: number,
): GraficoFaturamentoItem[] {
  return rotulos.map((rotulo, indice) => ({
    rotulo,
    valor: base + incremento * indice + Math.round(Math.sin((indice + 1) * 0.7) * 1200),
  }));
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  @ViewChild('faturamentoCanvas') private faturamentoCanvas?: ElementRef<HTMLCanvasElement>;

  readonly consultasHoje = 18;
  readonly confirmacoesHoje = 13;
  readonly cancelamentosHoje = 2;
  readonly pacientesAtivos = 248;
  readonly pacientesNovosNoMes = 15;
  readonly periodosFaturamento: Record<PeriodoFaturamento, FaturamentoPeriodo> = {
    mensal: { valor: 42870, meta: 60000, crescimento: 12 },
    trimestral: { valor: 123540, meta: 180000, crescimento: 8 },
    anual: { valor: 512780, meta: 720000, crescimento: 17 },
  };

  readonly graficoFaturamento: Record<PeriodoFaturamento, GraficoFaturamentoItem[]> = {
    mensal: gerarSerieFaturamento(
      Array.from({ length: 31 }, (_, indice) => String(indice + 1)),
      1200,
      75,
    ),
    trimestral: [
      { rotulo: 'Jan', valor: 35200 },
      { rotulo: 'Fev', valor: 38200 },
      { rotulo: 'Mar', valor: 42870 },
    ],
    anual: [
      { rotulo: 'Jan', valor: 35200 },
      { rotulo: 'Fev', valor: 38200 },
      { rotulo: 'Mar', valor: 42870 },
      { rotulo: 'Abr', valor: 45120 },
      { rotulo: 'Mai', valor: 46790 },
      { rotulo: 'Jun', valor: 48920 },
      { rotulo: 'Jul', valor: 50340 },
      { rotulo: 'Ago', valor: 52180 },
      { rotulo: 'Set', valor: 54460 },
      { rotulo: 'Out', valor: 55980 },
      { rotulo: 'Nov', valor: 57840 },
      { rotulo: 'Dez', valor: 60340 },
    ],
  };

  periodoFaturamentoSelecionado: PeriodoFaturamento = 'mensal';
  ocultarFaturamento = false;

  readonly proximasConsultas: ProximaConsulta[] = [
    {
      id: 'c-1001',
      horario: '09:30',
      paciente: 'Mariana Souza',
      dentista: 'Dra. Beatriz',
      procedimento: 'Avaliacao de rotina',
    },
    {
      id: 'c-1002',
      horario: '10:15',
      paciente: 'Carlos Andrade',
      dentista: 'Dra. Luciana',
      procedimento: 'Profilaxia',
    },
    {
      id: 'c-1003',
      horario: '11:00',
      paciente: 'Ana Paula Lima',
      dentista: 'Dra. Beatriz',
      procedimento: 'Revisao ortodontica',
    },
  ];

  readonly procedimentosMaisRealizados: ProcedimentoResumo[] = [
    { nome: 'Profilaxia', total: 34, percentual: 29 },
    { nome: 'Avaliacao inicial', total: 27, percentual: 23 },
    { nome: 'Restauracao', total: 21, percentual: 18 },
    { nome: 'Canal', total: 12, percentual: 10 },
  ];

  readonly conveniosUtilizados: ConvenioResumo[] = [
    { nome: 'Particular', consultas: 41, percentual: 35 },
    { nome: 'OdontoPlus', consultas: 32, percentual: 27 },
    { nome: 'DentalLife', consultas: 28, percentual: 24 },
    { nome: 'Sorrir Bem', consultas: 16, percentual: 14 },
  ];

  private faturamentoChart?: Chart<'line', number[], string>;

  constructor(private readonly authService: AuthService) {}

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
