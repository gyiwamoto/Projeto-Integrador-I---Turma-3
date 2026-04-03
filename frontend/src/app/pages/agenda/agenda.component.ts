import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AgendaCalendarioComponent,
  DiaAgenda,
  ModoVisualizacaoAgenda,
} from '../../components/agenda-calendario/agenda-calendario.component';
import { AgendaConsulta, AgendaPaciente } from '../../interfaces/Agenda';
import { ModalComponent } from '../../components/modal/modal.component';
import { AgendaService } from '../../services/agenda.service';
import { ToastService } from '../../services/toast.service';

interface Slot {
  hora: number;
  min: number;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AgendaCalendarioComponent],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly agendaService = inject(AgendaService);
  private readonly toastService = inject(ToastService);

  readonly horas = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  readonly minutos = [0, 15, 30, 45];

  doutoraSelecionada: 'beatriz' | 'luciana' = 'beatriz';
  diaSelecionado = new Date().getDate();
  mesSelecionado = new Date().getMonth();
  anoSelecionado = new Date().getFullYear();
  semanaOffset = 0;
  modoVisualizacao: ModoVisualizacaoAgenda = 'semana';

  modalAcaoAberto = false;
  modalBuscaAberto = false;
  modalConfirmAberto = false;
  slotSelecionado: Slot | null = null;

  carregandoPacientes = false;
  carregandoConsultas = false;
  termoBusca = '';
  pacienteSelecionado: AgendaPaciente | null = null;

  pacientes: AgendaPaciente[] = [];
  consultas: AgendaConsulta[] = [];

  readonly meses = [
    'JANEIRO',
    'FEVEREIRO',
    'MARCO',
    'ABRIL',
    'MAIO',
    'JUNHO',
    'JULHO',
    'AGOSTO',
    'SETEMBRO',
    'OUTUBRO',
    'NOVEMBRO',
    'DEZEMBRO',
  ];

  readonly diasNomes = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  readonly consultaNoSlot = (hora: number, min: number): string => this.getConsulta(hora, min);

  ngOnInit(): void {
    this.carregarPacientes();
    this.carregarConsultas();
  }

  get pacientesFiltrados(): AgendaPaciente[] {
    if (!this.termoBusca.trim()) {
      return this.pacientes;
    }

    const termo = this.normalizar(this.termoBusca);
    return this.pacientes.filter((paciente) => {
      return [
        paciente.nome,
        paciente.codigoPaciente,
        paciente.telefone,
        paciente.email,
        String(paciente.id),
      ]
        .map((valor) => this.normalizar(valor))
        .join(' ')
        .includes(termo);
    });
  }

  get diasSemana(): DiaAgenda[] {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    const diaSemana = hoje.getDay();
    const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicioSemana.setDate(hoje.getDate() + diffParaSegunda + this.semanaOffset * 7);

    return Array.from({ length: 6 }, (_, indice) => {
      const data = new Date(inicioSemana);
      data.setDate(inicioSemana.getDate() + indice);

      return this.montarDiaAgenda(data);
    });
  }

  get diasMes(): DiaAgenda[] {
    const primeiroDia = new Date(this.anoSelecionado, this.mesSelecionado, 1);
    const diasNoMes = new Date(this.anoSelecionado, this.mesSelecionado + 1, 0).getDate();

    return Array.from({ length: diasNoMes }, (_, indice) => {
      const data = new Date(primeiroDia);
      data.setDate(primeiroDia.getDate() + indice);
      return this.montarDiaAgenda(data);
    });
  }

  get diasExibidos(): DiaAgenda[] {
    return this.modoVisualizacao === 'mes' ? this.diasMes : this.diasSemana;
  }

  get nomeDiaSelecionado(): string {
    return (
      this.diasNomes[
        new Date(this.anoSelecionado, this.mesSelecionado, this.diaSelecionado).getDay()
      ] ?? ''
    );
  }

  get mesAtual(): string {
    return this.meses[this.mesSelecionado] ?? '';
  }

  get mesSelecionadoEhAtual(): boolean {
    const hoje = new Date();
    return hoje.getMonth() === this.mesSelecionado && hoje.getFullYear() === this.anoSelecionado;
  }

  get anoAtual(): number {
    return this.anoSelecionado;
  }

  get nomeProfissionalSelecionado(): string {
    return this.doutoraSelecionada === 'beatriz' ? 'Dra. Beatriz' : 'Dra. Luciana';
  }

  getConsulta(hora: number, min: number): string {
    const consulta = this.consultasDoDiaSelecionado.find((item) => {
      const data = new Date(item.dataConsulta);
      return data.getHours() === hora && data.getMinutes() === min;
    });

    return consulta ? `${consulta.pacienteId} ${consulta.pacienteNome}` : '';
  }

  selecionarDia(dia: number, mes: number, ano: number): void {
    this.diaSelecionado = dia;
    this.mesSelecionado = mes;
    this.anoSelecionado = ano;
  }

  selecionarModoVisualizacao(modo: ModoVisualizacaoAgenda): void {
    this.modoVisualizacao = modo;

    if (modo === 'semana') {
      const hoje = new Date();
      this.semanaOffset = 0;
      this.selecionarDia(hoje.getDate(), hoje.getMonth(), hoje.getFullYear());
    }
  }

  selecionarDoutora(doutora: 'beatriz' | 'luciana'): void {
    this.doutoraSelecionada = doutora;
  }

  semanaAnterior(): void {
    this.semanaOffset -= 1;

    const primeiroDiaSemana = this.diasSemana[0];
    if (primeiroDiaSemana) {
      this.selecionarDia(primeiroDiaSemana.numero, primeiroDiaSemana.mes, primeiroDiaSemana.ano);
    }
  }

  proximaSemana(): void {
    this.semanaOffset += 1;

    const primeiroDiaSemana = this.diasSemana[0];
    if (primeiroDiaSemana) {
      this.selecionarDia(primeiroDiaSemana.numero, primeiroDiaSemana.mes, primeiroDiaSemana.ano);
    }
  }

  mesAnterior(): void {
    const data = new Date(this.anoSelecionado, this.mesSelecionado - 1, 1);
    this.anoSelecionado = data.getFullYear();
    this.mesSelecionado = data.getMonth();
    this.diaSelecionado = Math.min(
      this.diaSelecionado,
      new Date(this.anoSelecionado, this.mesSelecionado + 1, 0).getDate(),
    );
  }

  proximoMes(): void {
    const data = new Date(this.anoSelecionado, this.mesSelecionado + 1, 1);
    this.anoSelecionado = data.getFullYear();
    this.mesSelecionado = data.getMonth();
    this.diaSelecionado = Math.min(
      this.diaSelecionado,
      new Date(this.anoSelecionado, this.mesSelecionado + 1, 0).getDate(),
    );
  }

  periodoAnterior(): void {
    if (this.modoVisualizacao === 'mes') {
      this.mesAnterior();
      return;
    }

    this.semanaAnterior();
  }

  periodoProximo(): void {
    if (this.modoVisualizacao === 'mes') {
      this.proximoMes();
      return;
    }

    this.proximaSemana();
  }

  clicarSlot(hora: number, min: number): void {
    if (this.dataSelecionadaEhPassada()) {
      this.toastService.info('Nao e possivel marcar consulta em dias anteriores.');
      return;
    }

    if (this.getConsulta(hora, min)) {
      this.toastService.info('Horario ja ocupado para esta profissional.');
      return;
    }

    this.slotSelecionado = { hora, min };
    this.modalAcaoAberto = true;
  }

  escolherAgendar(): void {
    this.modalAcaoAberto = false;
    this.termoBusca = '';
    this.pacienteSelecionado = null;
    this.modalBuscaAberto = true;
  }

  escolherCadastrar(): void {
    this.modalAcaoAberto = false;
    void this.router.navigate(['/dashboard/pacientes'], {
      queryParams: {
        novo: '1',
      },
    });
  }

  selecionarPaciente(paciente: AgendaPaciente): void {
    this.pacienteSelecionado = paciente;
    this.modalBuscaAberto = false;
    this.modalConfirmAberto = true;
  }

  confirmarAgendamento(): void {
    if (!this.slotSelecionado || !this.pacienteSelecionado) {
      this.toastService.erro('Selecione um paciente e horario antes de confirmar.');
      return;
    }

    const dataConsulta = new Date(
      this.anoSelecionado,
      this.mesSelecionado,
      this.diaSelecionado,
      this.slotSelecionado.hora,
      this.slotSelecionado.min,
    );

    this.agendaService.registrarAgendamentoLocal({
      pacienteId: this.pacienteSelecionado.id,
      pacienteNome: this.pacienteSelecionado.nome,
      profissionalNome: this.nomeProfissionalSelecionado,
      dataConsulta: dataConsulta.toISOString(),
      status: 'agendado',
    });

    this.consultas = this.agendaService.consultas();
    this.toastService.sucesso('Consulta agendada com sucesso.');

    this.modalConfirmAberto = false;
    this.slotSelecionado = null;
    this.pacienteSelecionado = null;
  }

  fecharModalAcao(): void {
    this.modalAcaoAberto = false;
    this.slotSelecionado = null;
  }

  fecharModalBusca(): void {
    this.modalBuscaAberto = false;
    this.slotSelecionado = null;
  }

  fecharModalConfirmacao(): void {
    this.modalConfirmAberto = false;
    this.slotSelecionado = null;
  }

  private get consultasDoDiaSelecionado(): AgendaConsulta[] {
    const profissional = this.normalizar(this.nomeProfissionalSelecionado);

    return this.consultas.filter((consulta) => {
      const data = new Date(consulta.dataConsulta);
      const mesmoDia =
        data.getDate() === this.diaSelecionado &&
        data.getMonth() === this.mesSelecionado &&
        data.getFullYear() === this.anoSelecionado;

      const profissionalConsulta = this.normalizar(consulta.profissionalNome);
      const mesmaProfissional =
        profissionalConsulta.includes(this.doutoraSelecionada) ||
        profissionalConsulta.includes(profissional);

      return mesmoDia && mesmaProfissional;
    });
  }

  private carregarPacientes(): void {
    this.carregandoPacientes = true;

    this.agendaService.listarPacientes().subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
        this.carregandoPacientes = false;
      },
      error: (error: Error) => {
        this.carregandoPacientes = false;
        this.toastService.erro(error.message || 'Falha ao carregar pacientes da agenda.');
      },
    });
  }

  private carregarConsultas(): void {
    this.carregandoConsultas = true;

    this.agendaService.listarConsultas().subscribe({
      next: (consultas) => {
        this.consultas = consultas;
        this.carregandoConsultas = false;
      },
      error: (error: Error) => {
        this.carregandoConsultas = false;
        this.toastService.erro(error.message || 'Falha ao carregar consultas da agenda.');
      },
    });
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private montarDiaAgenda(data: Date): DiaAgenda {
    const hoje = new Date();

    return {
      nome: this.diasNomes[data.getDay()] ?? '',
      numero: data.getDate(),
      mes: data.getMonth(),
      ano: data.getFullYear(),
      hoje:
        data.getDate() === hoje.getDate() &&
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear(),
    };
  }

  private dataSelecionadaEhPassada(): boolean {
    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const selecionada = new Date(this.anoSelecionado, this.mesSelecionado, this.diaSelecionado);

    return selecionada < hojeSemHora;
  }
}
