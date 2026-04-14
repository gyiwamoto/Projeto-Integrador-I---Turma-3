import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AgendaConsulta } from '../../interfaces/Agenda';
import { ConvenioResumo, ProcedimentoResumo, ProximaConsulta } from '../../interfaces/Dashboard';
import { PacienteItem } from '../../interfaces/Paciente';
import { ProcedimentoRealizadoItem } from '../../interfaces/ProcedimentoRealizado';
import { AgendaService } from '../../services/agenda.service';
import { AuthService } from '../../services/auth.service';
import { PacientesService } from '../../services/pacientes.service';
import {
  ListarProcedimentosRealizadosResponse,
  ProcedimentosRealizadosService,
} from '../../services/procedimentos-realizados.service';
import { formatarData, formatarDataHora } from '../../utils/formatar-data';

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

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authService = inject(AuthService);
  private readonly agendaService = inject(AgendaService);
  private readonly pacientesService = inject(PacientesService);
  private readonly procedimentosRealizadosService = inject(ProcedimentosRealizadosService);

  carregandoDados = false;
  erroDados = '';

  consultasHoje = 0;
  confirmacoesHoje = 0;
  cancelamentosHoje = 0;
  pacientesAtivos = 0;
  pacientesNovosNoMes = 0;

  proximasConsultas: ProximaConsulta[] = [];
  procedimentosMaisRealizados: ProcedimentoResumo[] = [];
  conveniosUtilizados: ConvenioResumo[] = [];

  ngOnInit(): void {
    this.carregarDashboard();
  }

  get nomeUsuario(): string {
    return this.authService.obterSessaoAutenticada()?.nome ?? 'Equipe da clínica';
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
    }).subscribe({
      next: ({ consultas, pacientes, procedimentos }) => {
        this.aplicarDadosDashboard(consultas, pacientes, procedimentos);
        this.carregandoDados = false;
        this.cdr.markForCheck();
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
  ): void {
    const agora = new Date();

    this.consultasHoje = consultas.filter(
      (consulta) => formatarData(consulta.dataConsulta, 'input') === formatarData(agora, 'input'),
    ).length;

    this.confirmacoesHoje = consultas.filter(
      (consulta) =>
        formatarData(consulta.dataConsulta, 'input') === formatarData(agora, 'input') &&
        consulta.status === 'realizado',
    ).length;

    this.cancelamentosHoje = consultas.filter(
      (consulta) =>
        formatarData(consulta.dataConsulta, 'input') === formatarData(agora, 'input') &&
        consulta.status === 'cancelado',
    ).length;

    this.pacientesAtivos = pacientes.length;
    this.pacientesNovosNoMes = pacientes.filter(
      (paciente) =>
        formatarData(paciente.criadoEm, 'input').slice(0, 7) ===
        formatarData(agora, 'input').slice(0, 7),
    ).length;

    this.proximasConsultas = this.montarProximasConsultas(consultas, agora);
    this.procedimentosMaisRealizados = this.montarProcedimentosMaisRealizados(procedimentos, agora);
    this.conveniosUtilizados = this.montarConveniosUtilizados(consultas, agora);
  }

  private montarProximasConsultas(consultas: AgendaConsulta[], agora: Date): ProximaConsulta[] {
    return consultas
      .filter(
        (consulta) =>
          consulta.status === 'agendado' &&
          formatarDataHora(consulta.dataConsulta, 'input') >= formatarDataHora(agora, 'input'),
      )
      .sort((primeira, segunda) =>
        formatarDataHora(primeira.dataConsulta, 'input').localeCompare(
          formatarDataHora(segunda.dataConsulta, 'input'),
        ),
      )
      .slice(0, 3)
      .map((consulta) => {
        const dataConsulta = formatarDataHora(consulta.dataConsulta, 'input');
        const hora = dataConsulta.split('T')[1] ?? '';

        return {
          id: consulta.id,
          horario: hora,
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
    const procedimentosMes = procedimentos.filter(
      (procedimento) =>
        formatarData(procedimento.dataProcedimento, 'input').slice(0, 7) ===
        formatarData(agora, 'input').slice(0, 7),
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
    const consultasMes = consultas.filter(
      (consulta) =>
        formatarData(consulta.dataConsulta, 'input').slice(0, 7) ===
        formatarData(agora, 'input').slice(0, 7),
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
}
