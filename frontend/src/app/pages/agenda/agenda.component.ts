import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AgendaCalendarioComponent,
  DiaAgenda,
  ModoVisualizacaoAgenda,
} from '../../components/agenda-calendario/agenda-calendario.component';
import { AgendaConsulta, AgendaPaciente } from '../../interfaces/Agenda';
import { ModalComponent } from '../../components/modal/modal.component';
import { AgendaService } from '../../services/agenda.service';
import { ToastService } from '../../services/toast.service';
import { PROCEDIMENTOS, type Procedimento } from '../../constants/procedimentos';
import { UsuariosService } from '../../services/usuarios.service';
import { UsuarioListaItem } from '../../interfaces/Usuario';
import { formatarData, formatarDataHora, formatarIntervaloDatas } from '../../utils/formatar-data';

interface Slot {
  hora: number;
  min: number;
}

interface DentistaAgenda {
  id: string;
  nome: string;
}

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, AgendaCalendarioComponent],
  templateUrl: './agenda.component.html',
  styleUrl: './agenda.component.scss',
})
export class AgendaComponent implements OnInit {
  private static readonly CHAVE_DENTISTA_SELECIONADO = 'agenda:dentista-selecionado-id';
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly agendaService = inject(AgendaService);
  private readonly toastService = inject(ToastService);
  private readonly usuariosService = inject(UsuariosService);
  private static readonly PROCEDIMENTO_AVALIACAO_CODIGO = '100';
  private static readonly DURACAO_PADRAO_MIN = 30;

  readonly horas = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  readonly minutos = [0, 15, 30, 45];
  readonly procedimentos: Procedimento[] = PROCEDIMENTOS;

  dentistaSelecionadoId = signal('');
  carregandoPacientes = signal(false);
  carregandoConsultas = signal(false);
  diaSelecionado = new Date().getDate();
  mesSelecionado = new Date().getMonth();
  anoSelecionado = new Date().getFullYear();
  modoVisualizacao: ModoVisualizacaoAgenda = 'semana';

  modalAcaoAberto = false;
  modalBuscaAberto = false;
  modalConfirmAberto = false;
  procedimentosDropdownAberto = false;
  slotSelecionado: Slot | null = null;

  salvandoAgendamento = false;
  termoBusca = '';
  pacienteSelecionado: AgendaPaciente | null = null;
  pacientePreSelecionado: AgendaPaciente | null = null;
  consultaReagendamentoId: string | null = null;
  procedimentosAgendados: string[] = [AgendaComponent.PROCEDIMENTO_AVALIACAO_CODIGO];

  pacientes = signal<AgendaPaciente[]>([]);
  consultas = signal<AgendaConsulta[]>([]);
  dentistas = signal<DentistaAgenda[]>([]);

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
    this.carregarPacienteDaRota();
    this.carregarDentistas();
    this.carregarPacientes();
    this.carregarConsultas();
  }

  get pacientesFiltrados(): AgendaPaciente[] {
    const pacientes = this.pacientes();

    if (!this.termoBusca.trim()) {
      return pacientes;
    }

    const termo = this.normalizar(this.termoBusca);
    return pacientes.filter((paciente) => {
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
    const referencia = this.dataSelecionada;
    const diaSemana = referencia.getDay();
    const diffParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;

    const inicioSemana = new Date(referencia);
    inicioSemana.setDate(referencia.getDate() + diffParaSegunda);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 5);

    const dias: DiaAgenda[] = [];
    const cursor = new Date(inicioSemana);
    while (cursor <= fimSemana) {
      dias.push(this.montarDiaAgenda(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return dias;
  }

  get diasMes(): DiaAgenda[] {
    const diasNoMes = new Date(this.anoSelecionado, this.mesSelecionado + 1, 0).getDate();
    const diaInicial = 1;

    return Array.from({ length: diasNoMes - diaInicial + 1 }, (_, indice) => {
      const data = new Date(this.anoSelecionado, this.mesSelecionado, diaInicial + indice);
      return this.montarDiaAgenda(data);
    });
  }

  get diasExibidos(): DiaAgenda[] {
    return this.modoVisualizacao === 'mes' ? this.diasMes : this.diasSemana;
  }

  get nomeDiaSelecionado(): string {
    return this.diasNomes[this.dataSelecionada.getDay()] ?? '';
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
    return (
      this.dentistas().find((dentista) => dentista.id === this.dentistaSelecionadoId())?.nome ??
      'Profissional nao informado'
    );
  }

  get emModoReagendamento(): boolean {
    return Boolean(this.consultaReagendamentoId);
  }

  get duracaoSelecionadaMinutos(): number {
    const codigos = this.procedimentosAgendados;
    const selecionados = this.procedimentos.filter((procedimento) =>
      codigos.includes(procedimento.codigo),
    );
    const soma = selecionados.reduce((total, procedimento) => total + procedimento.tempoMinutos, 0);
    return soma > 0 ? soma : AgendaComponent.DURACAO_PADRAO_MIN;
  }

  get duracaoSelecionadaTexto(): string {
    const totalMinutos = this.duracaoSelecionadaMinutos;
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;

    if (!horas) {
      return `${minutos} min`;
    }

    if (!minutos) {
      return `${horas}h`;
    }

    return `${horas}h ${String(minutos).padStart(2, '0')}min`;
  }

  get procedimentosResumo(): string {
    const selecionados = this.procedimentos
      .filter((procedimento) => this.procedimentoSelecionado(procedimento.codigo))
      .map((procedimento) => procedimento.nome);

    if (!selecionados.length) {
      return 'Selecione um ou mais procedimentos';
    }

    if (selecionados.length <= 2) {
      return selecionados.join(', ');
    }

    return `${selecionados.slice(0, 2).join(', ')} + ${selecionados.length - 2} outro(s)`;
  }

  getConsulta(hora: number, min: number): string {
    const consulta = this.obterConsultaNoSlot(hora, min);

    if (!consulta) {
      return '';
    }

    const codigoPaciente =
      consulta.codigoPaciente?.trim() || this.obterCodigoPacientePorId(consulta.pacienteId);
    return `${codigoPaciente} ${consulta.pacienteNome}`.trim();
  }

  selecionarDia(dia: number, mes: number, ano: number): void {
    this.diaSelecionado = dia;
    this.mesSelecionado = mes;
    this.anoSelecionado = ano;
    this.carregarConsultasPeriodoAtual();
  }

  selecionarModoVisualizacao(modo: ModoVisualizacaoAgenda): void {
    this.modoVisualizacao = modo;

    if (modo === 'semana') {
      const hoje = new Date();
      this.selecionarDia(hoje.getDate(), hoje.getMonth(), hoje.getFullYear());
      return;
    }

    this.carregarConsultasPeriodoAtual();
  }

  selecionarDentista(dentistaId: string): void {
    this.dentistaSelecionadoId.set(dentistaId);
    this.salvarDentistaSelecionado(dentistaId);
  }

  alternarDropdownProcedimentos(): void {
    this.procedimentosDropdownAberto = !this.procedimentosDropdownAberto;
  }

  fecharDropdownProcedimentos(): void {
    this.procedimentosDropdownAberto = false;
  }

  semanaAnterior(): void {
    const data = this.dataSelecionada;
    data.setDate(data.getDate() - 7);
    this.selecionarDia(data.getDate(), data.getMonth(), data.getFullYear());
  }

  proximaSemana(): void {
    const data = this.dataSelecionada;
    data.setDate(data.getDate() + 7);
    this.selecionarDia(data.getDate(), data.getMonth(), data.getFullYear());
  }

  mesAnterior(): void {
    const data = new Date(this.anoSelecionado, this.mesSelecionado - 1, 1);
    this.anoSelecionado = data.getFullYear();
    this.mesSelecionado = data.getMonth();
    this.diaSelecionado = Math.min(
      this.diaSelecionado,
      new Date(this.anoSelecionado, this.mesSelecionado + 1, 0).getDate(),
    );

    this.carregarConsultasPeriodoAtual();
  }

  proximoMes(): void {
    const data = new Date(this.anoSelecionado, this.mesSelecionado + 1, 1);
    this.anoSelecionado = data.getFullYear();
    this.mesSelecionado = data.getMonth();
    this.diaSelecionado = Math.min(
      this.diaSelecionado,
      new Date(this.anoSelecionado, this.mesSelecionado + 1, 0).getDate(),
    );

    this.carregarConsultasPeriodoAtual();
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

    if (!this.emModoReagendamento) {
      this.definirProcedimentosPadrao();
    }

    if (this.pacienteSelecionado || this.pacientePreSelecionado) {
      this.pacienteSelecionado = this.pacienteSelecionado ?? this.pacientePreSelecionado;
      this.modalConfirmAberto = true;
      return;
    }

    this.modalAcaoAberto = true;
  }

  escolherAgendar(): void {
    this.modalAcaoAberto = false;

    if (this.pacientePreSelecionado) {
      this.pacienteSelecionado = this.pacientePreSelecionado;
      this.modalConfirmAberto = true;
      return;
    }

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

    if (this.salvandoAgendamento) {
      return;
    }

    const dataConsulta = new Date(
      this.anoSelecionado,
      this.mesSelecionado,
      this.diaSelecionado,
      this.slotSelecionado.hora,
      this.slotSelecionado.min,
    );

    this.salvandoAgendamento = true;

    const dataConsultaFormatada = formatarDataHora(dataConsulta, 'backend');
    const procedimentosAgendados = this.procedimentosAgendados.slice();
    const duracaoEstimadaMin = this.duracaoSelecionadaMinutos;
    const consultaReagendamentoId = this.consultaReagendamentoId;

    this.modalConfirmAberto = false;
    this.procedimentosDropdownAberto = false;

    const requisicao = this.consultaReagendamentoId
      ? this.agendaService.atualizarConsulta(this.consultaReagendamentoId, {
          status: 'agendado',
          dataConsulta: dataConsultaFormatada,
          procedimentosAgendados,
          duracaoEstimadaMin,
        })
      : this.agendaService.criarConsulta({
          pacienteId: this.pacienteSelecionado.id,
          usuarioId: this.dentistaSelecionadoId(),
          dataConsulta: dataConsultaFormatada,
          status: 'agendado',
          procedimentosAgendados,
          duracaoEstimadaMin,
        });

    requisicao.subscribe({
      next: (resposta) => {
        const eraReagendamento = Boolean(consultaReagendamentoId);

        this.salvandoAgendamento = false;
        this.slotSelecionado = null;
        this.consultaReagendamentoId = null;
        this.definirProcedimentosPadrao();

        if (this.ehRespostaComConsulta(resposta)) {
          this.aplicarUpsertConsultaLocal(resposta.consulta);
        } else if (eraReagendamento && consultaReagendamentoId) {
          this.aplicarReagendamentoLocal(
            consultaReagendamentoId,
            dataConsultaFormatada,
            procedimentosAgendados,
            duracaoEstimadaMin,
          );
        }

        this.pacientePreSelecionado = null;

        this.pacienteSelecionado = null;

        this.carregarConsultasPeriodoAtual(true);
        this.limparParametrosAgendamentoDaUrl();

        this.toastService.sucesso(
          eraReagendamento ? 'Consulta reagendada com sucesso.' : 'Consulta agendada com sucesso.',
        );
      },
      error: (error: Error) => {
        this.salvandoAgendamento = false;
        this.toastService.erro(error.message || 'Nao foi possivel agendar a consulta.');
      },
    });
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
    this.procedimentosDropdownAberto = false;
    this.slotSelecionado = null;

    if (!this.emModoReagendamento) {
      this.definirProcedimentosPadrao();
    }
  }

  alternarProcedimento(codigo: string): void {
    const jaSelecionado = this.procedimentosAgendados.includes(codigo);

    if (jaSelecionado) {
      const restante = this.procedimentosAgendados.filter((item) => item !== codigo);
      this.procedimentosAgendados = restante.length
        ? restante
        : [AgendaComponent.PROCEDIMENTO_AVALIACAO_CODIGO];
      return;
    }

    this.procedimentosAgendados = [...this.procedimentosAgendados, codigo];
  }

  procedimentoSelecionado(codigo: string): boolean {
    return this.procedimentosAgendados.includes(codigo);
  }

  private get consultasDoDiaSelecionado(): AgendaConsulta[] {
    return this.consultas().filter((consulta) => {
      const dataConsulta = formatarData(consulta.dataConsulta, 'input');
      const dataSelecionada = formatarData(this.dataSelecionada, 'input');

      if (!dataConsulta) {
        return false;
      }

      const mesmoDia = dataConsulta === dataSelecionada;

      const mesmoProfissional =
        !this.dentistaSelecionadoId() || consulta.usuarioId === this.dentistaSelecionadoId();

      return mesmoDia && mesmoProfissional;
    });
  }

  private carregarDentistas(): void {
    this.usuariosService.listarUsuarios().subscribe({
      next: (resposta) => {
        this.aplicarDentistasDaLista(resposta.usuarios ?? []);
      },
      error: () => {
        this.aplicarDentistasDaLista(this.usuariosService.obterUsuariosEmCache());
      },
    });
  }

  private aplicarDentistasDaLista(usuarios: UsuarioListaItem[]): void {
    const dentistas = usuarios
      .filter((usuario) => usuario.tipo_usuario === 'dentista')
      .map((usuario) => ({ id: String(usuario.id), nome: usuario.nome.trim() }))
      .filter((usuario) => Boolean(usuario.id && usuario.nome));

    this.dentistas.set(dentistas);

    if (!this.dentistas().length) {
      this.dentistaSelecionadoId.set('');
      this.salvarDentistaSelecionado('');
      return;
    }

    const dentistaSalvo = this.obterDentistaSelecionadoSalvo();
    if (!this.dentistaSelecionadoId() && dentistaSalvo) {
      this.dentistaSelecionadoId.set(dentistaSalvo);
    }

    const dentistaJaSelecionado = this.dentistas().some(
      (dentista) => dentista.id === this.dentistaSelecionadoId(),
    );

    if (!dentistaJaSelecionado) {
      this.dentistaSelecionadoId.set(this.dentistas()[0]?.id ?? '');
    }

    this.salvarDentistaSelecionado(this.dentistaSelecionadoId());
  }

  private carregarPacientes(): void {
    this.carregandoPacientes.set(true);

    this.agendaService.listarPacientes().subscribe({
      next: (pacientes) => {
        this.pacientes.set(pacientes);
        this.sincronizarPacientePreSelecionado();
        this.carregandoPacientes.set(false);
      },
      error: (error: Error) => {
        this.carregandoPacientes.set(false);
        this.toastService.erro(error.message || 'Falha ao carregar pacientes da agenda.');
      },
    });
  }

  private carregarPacienteDaRota(): void {
    const consultaId = this.route.snapshot.queryParamMap.get('consultaId')?.trim() ?? '';
    const pacienteId = this.route.snapshot.queryParamMap.get('pacienteId')?.trim() ?? '';
    const pacienteNome = this.route.snapshot.queryParamMap.get('pacienteNome')?.trim() ?? '';
    const pacienteCodigo = this.route.snapshot.queryParamMap.get('pacienteCodigo')?.trim() ?? '';
    const pacienteTelefone =
      this.route.snapshot.queryParamMap.get('pacienteTelefone')?.trim() ?? '';
    const dataConsulta = this.route.snapshot.queryParamMap.get('dataConsulta')?.trim() ?? '';
    const profissionalNome =
      this.route.snapshot.queryParamMap.get('profissionalNome')?.trim() ?? '';
    const usuarioId = this.route.snapshot.queryParamMap.get('usuarioId')?.trim() ?? '';
    const procedimentosAgendadosQuery =
      this.route.snapshot.queryParamMap.get('procedimentosAgendados')?.trim() ?? '';

    this.consultaReagendamentoId = consultaId || null;

    if (usuarioId) {
      this.dentistaSelecionadoId.set(usuarioId);
    }

    if (procedimentosAgendadosQuery) {
      const codigos = procedimentosAgendadosQuery
        .split(',')
        .map((item) => item.trim())
        .filter((item) => this.procedimentos.some((procedimento) => procedimento.codigo === item));

      if (codigos.length) {
        this.procedimentosAgendados = Array.from(new Set(codigos));
      }
    }

    if (!this.dentistaSelecionadoId() && profissionalNome) {
      const nomeNormalizado = this.normalizar(profissionalNome);
      const dentistaPorNome = this.dentistas().find(
        (dentista) => this.normalizar(dentista.nome) === nomeNormalizado,
      );

      if (dentistaPorNome) {
        this.dentistaSelecionadoId.set(dentistaPorNome.id);
      }
    }

    if (dataConsulta) {
      const dataInput = formatarData(dataConsulta, 'input');
      const [ano, mes, dia] = dataInput.split('-');

      if (ano && mes && dia) {
        this.diaSelecionado = Number(dia);
        this.mesSelecionado = Number(mes) - 1;
        this.anoSelecionado = Number(ano);
      }
    }

    if (!pacienteId) {
      this.pacientePreSelecionado = null;
      return;
    }

    this.pacientePreSelecionado = {
      id: pacienteId,
      codigoPaciente: pacienteCodigo,
      nome: pacienteNome || 'Paciente selecionado',
      telefone: pacienteTelefone,
      email: '',
      numeroCarteirinha: '',
    };

    this.pacienteSelecionado = this.pacientePreSelecionado;
  }

  private sincronizarPacientePreSelecionado(): void {
    if (!this.pacientePreSelecionado) {
      return;
    }

    const pacienteCompleto = this.pacientes().find(
      (paciente) => paciente.id === this.pacientePreSelecionado?.id,
    );
    if (pacienteCompleto) {
      this.pacientePreSelecionado = pacienteCompleto;
      this.pacienteSelecionado = pacienteCompleto;
    }
  }

  private carregarConsultas(forcarAtualizacao = false): void {
    this.carregandoConsultas.set(true);

    const intervalo = this.obterIntervaloVisivel();

    this.agendaService.listarConsultas(forcarAtualizacao, 'geral', intervalo).subscribe({
      next: (consultas) => {
        this.consultas.set(consultas);
        this.carregandoConsultas.set(false);
      },
      error: (error: Error) => {
        this.carregandoConsultas.set(false);
        this.toastService.erro(error.message || 'Falha ao carregar consultas da agenda.');
      },
    });
  }

  private carregarConsultasPeriodoAtual(forcarAtualizacao = false): void {
    this.carregarConsultas(forcarAtualizacao);
  }

  private aplicarReagendamentoLocal(
    consultaId: string,
    dataConsulta: string,
    procedimentosAgendados: string[],
    duracaoEstimadaMin: number,
  ): void {
    const consultasAtualizadas = this.consultas().map((consulta) => {
      if (consulta.id !== consultaId) {
        return consulta;
      }

      return {
        ...consulta,
        dataConsulta,
        status: 'agendado' as AgendaConsulta['status'],
        procedimentosAgendados,
        duracaoEstimadaMin,
      };
    });

    this.consultas.set(consultasAtualizadas);
  }

  private aplicarUpsertConsultaLocal(consultaAtualizada: AgendaConsulta): void {
    const consultasAtuais = this.consultas();
    const indice = consultasAtuais.findIndex((consulta) => consulta.id === consultaAtualizada.id);

    if (indice < 0) {
      this.consultas.set([...consultasAtuais, consultaAtualizada]);
      return;
    }

    const atualizadas = consultasAtuais.slice();
    atualizadas[indice] = consultaAtualizada;
    this.consultas.set(atualizadas);
  }

  private ehRespostaComConsulta(
    resposta: { mensagem: string } | { mensagem: string; consulta: AgendaConsulta },
  ): resposta is { mensagem: string; consulta: AgendaConsulta } {
    return 'consulta' in resposta;
  }

  private limparParametrosAgendamentoDaUrl(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private definirProcedimentosPadrao(): void {
    this.procedimentosAgendados = [AgendaComponent.PROCEDIMENTO_AVALIACAO_CODIGO];
  }

  private obterConsultaNoSlot(hora: number, min: number): AgendaConsulta | undefined {
    return this.consultasDoDiaSelecionado.find((consulta) =>
      this.slotPertenceConsulta(consulta, hora, min),
    );
  }

  private slotPertenceConsulta(consulta: AgendaConsulta, hora: number, min: number): boolean {
    const dataConsulta = formatarDataHora(consulta.dataConsulta, 'input');
    if (!dataConsulta) {
      return false;
    }

    const [dataParte, horaParte] = dataConsulta.split('T');
    if (!dataParte || !horaParte) {
      return false;
    }

    const [ano, mes, dia] = dataParte.split('-');
    const [horaConsulta, minutoConsulta] = horaParte.split(':').map((item: string) => Number(item));

    if (!ano || !mes || !dia) {
      return false;
    }

    const dataInicio = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      horaConsulta,
      minutoConsulta,
    );
    const duracao = this.normalizarDuracaoConsulta(consulta);
    const inicioMinutos = dataInicio.getHours() * 60 + dataInicio.getMinutes();
    const fimMinutos = inicioMinutos + duracao;
    const slotMinutos = hora * 60 + min;

    return slotMinutos >= inicioMinutos && slotMinutos < fimMinutos;
  }

  private normalizarDuracaoConsulta(consulta: AgendaConsulta): number {
    const duracao = Number(consulta.duracaoEstimadaMin ?? AgendaComponent.DURACAO_PADRAO_MIN);

    if (!Number.isFinite(duracao) || duracao <= 0) {
      return AgendaComponent.DURACAO_PADRAO_MIN;
    }

    const arredondada = Math.ceil(duracao / 15) * 15;
    return Math.max(15, arredondada);
  }

  private get dataSelecionada(): Date {
    return new Date(this.anoSelecionado, this.mesSelecionado, this.diaSelecionado);
  }

  private obterIntervaloVisivel(): { dataInicio: string; dataFim: string } {
    const dias = this.diasExibidos;

    if (!dias.length) {
      const chave = formatarData(this.dataSelecionada, 'backend');
      return { dataInicio: chave, dataFim: chave };
    }

    const inicioDia = dias[0];
    const fimDia = dias[dias.length - 1];

    if (!inicioDia || !fimDia) {
      const chave = formatarData(this.dataSelecionada, 'backend');
      return { dataInicio: chave, dataFim: chave };
    }

    const inicio = new Date(inicioDia.ano, inicioDia.mes, inicioDia.numero);
    const fim = new Date(fimDia.ano, fimDia.mes, fimDia.numero);

    return formatarIntervaloDatas(inicio, fim, 'backend');
  }

  private obterCodigoPacientePorId(pacienteId: string): string {
    return (
      this.pacientes().find((paciente) => paciente.id === pacienteId)?.codigoPaciente ?? pacienteId
    );
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

  private obterDentistaSelecionadoSalvo(): string {
    if (typeof window === 'undefined') {
      return '';
    }

    try {
      return window.localStorage.getItem(AgendaComponent.CHAVE_DENTISTA_SELECIONADO) ?? '';
    } catch {
      return '';
    }
  }

  private salvarDentistaSelecionado(dentistaId: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (dentistaId) {
        window.localStorage.setItem(AgendaComponent.CHAVE_DENTISTA_SELECIONADO, dentistaId);
        return;
      }

      window.localStorage.removeItem(AgendaComponent.CHAVE_DENTISTA_SELECIONADO);
    } catch {
      // Ignora bloqueios de storage para nao quebrar fluxo da agenda.
    }
  }
}
