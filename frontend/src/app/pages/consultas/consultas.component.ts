import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FiltroCampo, FiltrosComponent } from '../../components/filtros/filtros.component';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';
import { AgendaConsulta, AgendaPaciente } from '../../interfaces/Agenda';
import { AgendaService } from '../../services/agenda.service';
import { ToastService } from '../../services/toast.service';

interface ConsultaLinha extends TabelaLinha {
  id: string;
  dataConsulta: string;
  pacienteNome: string;
  codigoPaciente: string;
  numeroCarteirinha: string;
  profissionalNome: string;
  status: string;
}

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [CommonModule, TabelaComponent, FiltrosComponent],
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.scss',
})
export class ConsultasComponent implements OnInit {
  private readonly agendaService = inject(AgendaService);
  private readonly toastService = inject(ToastService);

  readonly colunas: TabelaColuna[] = [
    { chave: 'dataConsulta', titulo: 'Data', formatador: (valor) => this.formatarData(valor) },
    { chave: 'pacienteNome', titulo: 'Paciente' },
    { chave: 'codigoPaciente', titulo: 'Codigo' },
    { chave: 'numeroCarteirinha', titulo: 'Carteirinha' },
    { chave: 'profissionalNome', titulo: 'Profissional' },
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

  carregando = false;
  linhas: ConsultaLinha[] = [];
  linhasFiltradas: ConsultaLinha[] = [];
  filtros: Record<string, string> = {};

  ngOnInit(): void {
    this.carregarDados();
  }

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtros = filtros;
    this.aplicarFiltros();
  }

  private carregarDados(): void {
    this.carregando = true;

    forkJoin({
      consultas: this.agendaService.listarConsultas(),
      pacientes: this.agendaService.listarPacientes(),
    }).subscribe({
      next: ({ consultas, pacientes }) => {
        this.linhas = this.montarLinhas(consultas, pacientes);
        this.aplicarFiltros();
        this.carregando = false;
      },
      error: (erro: Error) => {
        this.carregando = false;
        this.toastService.erro(erro.message || 'Nao foi possivel carregar as consultas.');
      },
    });
  }

  private montarLinhas(consultas: AgendaConsulta[], pacientes: AgendaPaciente[]): ConsultaLinha[] {
    const pacientesPorId = new Map<string, AgendaPaciente>();
    pacientes.forEach((paciente) => pacientesPorId.set(paciente.id, paciente));

    return consultas.map((consulta) => {
      const paciente = pacientesPorId.get(consulta.pacienteId);

      return {
        id: consulta.id,
        dataConsulta: consulta.dataConsulta,
        pacienteNome: consulta.pacienteNome,
        codigoPaciente: paciente?.codigoPaciente ?? '-',
        numeroCarteirinha: paciente?.numeroCarteirinha ?? '-',
        profissionalNome: consulta.profissionalNome,
        status: this.formatarStatus(consulta.status),
      };
    });
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

  private formatarData(valor: unknown): string {
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
}
