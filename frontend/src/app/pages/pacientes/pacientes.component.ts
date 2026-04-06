import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FiltroAcao,
  FiltroCampo,
  FiltrosComponent,
} from '../../components/filtros/filtros.component';
import { ModalComponent } from '../../components/modal/modal.component';
import {
  TabelaColuna,
  TabelaComponent,
  TabelaLinha,
} from '../../components/tabela/tabela.component';
import { AgendaConsulta } from '../../interfaces/Agenda';
import { ConvenioItem } from '../../interfaces/Convenio';
import { PacienteItem, SalvarPacientePayload } from '../../interfaces/Paciente';
import { ConveniosService } from '../../services/convenios.service';
import { AgendaService } from '../../services/agenda.service';
import { PacientesService } from '../../services/pacientes.service';
import { ProcedimentosRealizadosService } from '../../services/procedimentos-realizados.service';
import { ToastService } from '../../services/toast.service';
import { dentes, faces } from '../../utils/odontograma';
import { ProcedimentoRealizadoItem } from '../../interfaces/ProcedimentoRealizado';
import { formatarData } from '../../utils/formatar-data';

type ModoFormularioPaciente = 'criar' | 'editar';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, TabelaComponent, FiltrosComponent],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.scss',
})
export class PacientesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  private readonly agendaService = inject(AgendaService);
  private readonly pacientesService = inject(PacientesService);
  private readonly conveniosService = inject(ConveniosService);
  private readonly procedimentosRealizadosService = inject(ProcedimentosRealizadosService);

  filtros: Record<string, string> = {};
  carregando = false;
  salvando = false;
  excluindo = false;
  pacienteModalAberto = false;
  modalExclusaoAberto = false;
  modoFormulario: ModoFormularioPaciente = 'criar';

  pacienteSelecionado: PacienteItem | null = null;
  pacienteParaExcluir: PacienteItem | null = null;
  convenios: ConvenioItem[] = [];
  consultas: AgendaConsulta[] = [];
  consultaSelecionada: AgendaConsulta | null = null;
  consultaDetalheAberto = false;
  procedimentosConsultaSelecionada: ProcedimentoRealizadoItem[] = [];
  carregandoProcedimentos = false;

  readonly dentesOdontograma = dentes;
  readonly facesOdontograma = faces;

  readonly colunasConsultasPaciente: TabelaColuna[] = [
    {
      chave: 'dataConsulta',
      titulo: 'Data',
      formatador: (valor) => formatarData(valor),
    },
    { chave: 'codigoPaciente', titulo: 'Codigo' },
    { chave: 'profissionalNome', titulo: 'Profissional' },
    {
      chave: 'status',
      titulo: 'Status',
      formatador: (valor) => this.formatarStatusConsulta(valor),
    },
    {
      chave: 'observacoes',
      titulo: 'Observacoes',
      formatador: (valor) => this.formatarTextoCurto(valor),
    },
  ];

  readonly colunasProcedimentosConsulta: TabelaColuna[] = [
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

  readonly colunasTabela: TabelaColuna[] = [
    { chave: 'codigoPaciente', titulo: 'Codigo do paciente' },
    { chave: 'nome', titulo: 'Nome' },
    { chave: 'telefone', titulo: 'Telefone' },
    {
      chave: 'whatsappPush',
      titulo: 'Permite mensagem via WhatsApp',
      formatador: (valor) => (valor ? 'Permitido' : 'Não permitido'),
    },
  ];

  get camposFiltro(): FiltroCampo[] {
    return [
      {
        key: 'busca',
        label: 'Busca',
        type: 'text',
        placeholder: 'Codigo, nome, telefone, email ou carteirinha',
      },
      {
        key: 'convenio_cnpj',
        label: 'Convenio',
        type: 'select',
        options: this.convenios
          .filter(
            (convenio) =>
              convenio.ativo &&
              typeof convenio.cnpj === 'string' &&
              convenio.cnpj.trim().length > 0,
          )
          .map((convenio) => ({ label: convenio.nome, value: convenio.cnpj!.trim() })),
      },
    ];
  }

  get acoesFiltro(): FiltroAcao[] {
    return [
      {
        id: 'novo-paciente',
        label: 'Novo paciente',
        ordem: 1,
        tipo: 'custom',
        classe: 'primary',
      },
    ];
  }

  readonly formPaciente = this.fb.group({
    nome: ['', [Validators.required]],
    numeroCarteirinha: [''],
    dataNascimento: [''],
    telefone: [''],
    whatsappPush: [false],
    email: ['', [Validators.email]],
    convenioId: [''],
  });

  pacientes: PacienteItem[] = [];

  ngOnInit(): void {
    this.carregarConsultas();
    this.carregarConvenios();
    this.carregarPacientes();

    if (this.route.snapshot.queryParamMap.get('novo') === '1') {
      this.abrirNovoPaciente();
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
  }

  get pacientesFiltrados(): PacienteItem[] {
    const termo = (this.filtros['busca'] ?? '').trim().toLowerCase();
    const convenioId = (this.filtros['convenio_cnpj'] ?? '').trim();
    const whatsapp = (this.filtros['whatsapp'] ?? '').trim().toLowerCase();

    return this.pacientes.filter((paciente) => {
      const passouBusca =
        !termo ||
        [
          paciente.codigoPaciente,
          paciente.nome,
          paciente.numeroCarteirinha,
          paciente.telefone,
          paciente.email,
        ]
          .join(' ')
          .toLowerCase()
          .includes(termo);

      const passouConvenio = !convenioId || paciente.convenioId === convenioId;
      const statusWhatsapp = paciente.whatsappPush ? 'sim' : 'nao';
      const passouWhatsapp = !whatsapp || statusWhatsapp === whatsapp;

      return passouBusca && passouConvenio && passouWhatsapp;
    });
  }

  onFiltrosChange(filtros: Record<string, string>): void {
    this.filtros = filtros;
  }

  onAcaoFiltro(id: string): void {
    if (id === 'novo-paciente') {
      this.abrirNovoPaciente();
    }
  }

  onTelefoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valorFormatado = this.aplicarMascaraTelefone(input.value);

    input.value = valorFormatado;
    this.formPaciente.patchValue({ telefone: valorFormatado }, { emitEvent: false });
  }

  onDataNascimentoInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valorFormatado = this.aplicarMascaraDataNascimento(input.value);

    input.value = valorFormatado;
    this.formPaciente.patchValue({ dataNascimento: valorFormatado }, { emitEvent: false });
  }

  get linhasTabelaPacientes(): TabelaLinha[] {
    return this.pacientesFiltrados as unknown as TabelaLinha[];
  }

  get consultasPacienteSelecionado(): AgendaConsulta[] {
    if (!this.pacienteSelecionado) {
      return [];
    }

    return this.consultas
      .filter((consulta) => consulta.pacienteId === this.pacienteSelecionado?.id)
      .slice()
      .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime());
  }

  get linhasConsultasPaciente(): TabelaLinha[] {
    return this.consultasPacienteSelecionado as unknown as TabelaLinha[];
  }

  readonly acaoVisualizarPaciente = (linha: TabelaLinha): void => {
    this.abrirPaciente(linha as unknown as PacienteItem);
  };

  readonly acaoExcluirPaciente = (linha: TabelaLinha): void => {
    this.abrirExclusaoPaciente(linha as unknown as PacienteItem);
  };

  readonly acaoDetalharConsultaPaciente = (linha: TabelaLinha): void => {
    const consulta = linha as unknown as AgendaConsulta;
    this.abrirConsultaDetalhe(consulta);
  };

  abrirNovoPaciente(): void {
    this.modoFormulario = 'criar';
    this.pacienteSelecionado = null;
    this.pacienteModalAberto = true;
    this.formPaciente.reset({
      nome: '',
      numeroCarteirinha: '',
      dataNascimento: '',
      telefone: '',
      whatsappPush: false,
      email: '',
      convenioId: '',
    });
  }

  abrirPaciente(paciente: PacienteItem): void {
    this.modoFormulario = 'editar';
    this.pacienteSelecionado = paciente;
    this.pacienteModalAberto = true;
    this.preencherFormularioPaciente(paciente);
  }

  salvarPaciente(): void {
    if (this.formPaciente.invalid) {
      this.formPaciente.markAllAsTouched();
      return;
    }

    const valor = this.formPaciente.getRawValue();
    const payload: SalvarPacientePayload = {
      nome: (valor.nome ?? '').trim(),
      dataNascimento: valor.dataNascimento ?? '',
      telefone: (valor.telefone ?? '').trim(),
      whatsappPush: Boolean(valor.whatsappPush),
      email: (valor.email ?? '').trim(),
      convenioId: valor.convenioId ?? '',
      numeroCarteirinha: (valor.numeroCarteirinha ?? '').trim(),
    };

    if (this.modoFormulario === 'criar') {
      this.criarPaciente(payload);
      return;
    }

    if (!this.pacienteSelecionado) {
      return;
    }

    this.atualizarPaciente(this.pacienteSelecionado.id, payload);
  }

  fecharPacienteModal(): void {
    this.pacienteModalAberto = false;
    this.pacienteSelecionado = null;
    this.formPaciente.reset();
    this.fecharConsultaDetalhe();
  }

  abrirExclusaoPaciente(paciente: PacienteItem): void {
    this.pacienteParaExcluir = paciente;
    this.modalExclusaoAberto = true;
  }

  fecharModalExclusao(): void {
    this.modalExclusaoAberto = false;
    this.pacienteParaExcluir = null;
  }

  confirmarExclusaoPaciente(): void {
    if (!this.pacienteParaExcluir) {
      return;
    }

    this.excluindo = true;
    this.pacientesService.excluirPaciente(this.pacienteParaExcluir.id).subscribe({
      next: (resposta) => {
        this.excluindo = false;
        this.toastService.sucesso(resposta.mensagem);
        this.fecharModalExclusao();
        this.carregarPacientes();
      },
      error: (error: Error) => {
        this.excluindo = false;
        this.toastService.erro(error.message || 'Nao foi possivel excluir o paciente.');
      },
    });
  }

  agendarNovaConsulta(): void {
    if (!this.pacienteSelecionado) {
      return;
    }

    void this.router.navigate(['/dashboard/agendar-consulta'], {
      queryParams: {
        pacienteId: this.pacienteSelecionado.id,
        pacienteCodigo: this.pacienteSelecionado.codigoPaciente,
        pacienteNome: this.pacienteSelecionado.nome,
        pacienteTelefone: this.pacienteSelecionado.telefone,
      },
    });
  }

  abrirConsultaDetalhe(consulta: AgendaConsulta): void {
    this.consultaSelecionada = consulta;
    this.consultaDetalheAberto = true;
    this.carregarProcedimentosConsulta(consulta.id);
  }

  fecharConsultaDetalhe(): void {
    this.consultaDetalheAberto = false;
    this.consultaSelecionada = null;
    this.procedimentosConsultaSelecionada = [];
    this.carregandoProcedimentos = false;
  }

  irParaAtendimento(consulta: AgendaConsulta): void {
    void this.router.navigate(['/dashboard/atendimento'], {
      queryParams: { consultaId: consulta.id },
    });
  }

  possuiProcedimentoNoDenteFace(dente: number, faceCodigo: string): boolean {
    return this.procedimentosConsultaSelecionada.some(
      (procedimento) => procedimento.dente === dente && procedimento.face === faceCodigo,
    );
  }

  private preencherFormularioPaciente(paciente: PacienteItem): void {
    this.formPaciente.reset({
      nome: paciente.nome,
      numeroCarteirinha: paciente.numeroCarteirinha,
      dataNascimento: paciente.dataNascimento,
      telefone: this.aplicarMascaraTelefone(paciente.telefone),
      whatsappPush: paciente.whatsappPush,
      email: paciente.email,
      convenioId: paciente.convenioId,
    });
  }

  private aplicarMascaraTelefone(valor: string): string {
    const digitos = valor.replace(/\D/g, '').slice(0, 12);

    if (!digitos) {
      return '';
    }

    if (digitos.length <= 3) {
      return digitos;
    }

    return `${digitos.slice(0, 3)} ${digitos.slice(3)}`;
  }

  private aplicarMascaraDataNascimento(valor: string): string {
    const digitos = valor.replace(/\D/g, '').slice(0, 8);

    if (digitos.length <= 2) {
      return digitos;
    }

    if (digitos.length <= 4) {
      return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }

    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
  }

  private formatarTextoCurto(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      return '-';
    }

    return valor.trim().length > 42 ? `${valor.trim().slice(0, 42)}...` : valor.trim();
  }

  private formatarStatusConsulta(valor: unknown): string {
    if (typeof valor !== 'string' || !valor.trim()) {
      return '-';
    }

    if (valor === 'agendado') {
      return 'Agendado';
    }

    if (valor === 'realizado') {
      return 'Realizado';
    }

    if (valor === 'cancelado') {
      return 'Cancelado';
    }

    return valor;
  }

  private carregarConsultas(): void {
    this.agendaService.listarConsultas().subscribe({
      next: (consultas) => {
        this.consultas = consultas ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.consultas = [];
        this.cdr.markForCheck();
      },
    });
  }

  private carregarProcedimentosConsulta(consultaId: string): void {
    this.carregandoProcedimentos = true;

    this.procedimentosRealizadosService.listarPorConsulta(consultaId).subscribe({
      next: (procedimentos) => {
        this.procedimentosConsultaSelecionada = procedimentos ?? [];
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

  private carregarPacientes(): void {
    this.carregando = true;

    this.pacientesService.listarPacientes().subscribe({
      next: (resposta) => {
        this.pacientes = resposta?.pacientes ?? [];
        this.carregando = false;
        this.cdr.markForCheck();
      },
      error: (error: Error) => {
        this.carregando = false;
        this.toastService.erro(error.message || 'Nao foi possivel carregar os pacientes.');
        this.cdr.markForCheck();
      },
    });
  }

  private carregarConvenios(): void {
    this.conveniosService.listarConvenios().subscribe({
      next: (resposta) => {
        this.convenios = resposta.convenios;
      },
      error: () => {
        this.convenios = [];
      },
    });
  }

  private criarPaciente(payload: SalvarPacientePayload): void {
    this.salvando = true;

    this.pacientesService.criarPaciente(payload).subscribe({
      next: (resposta) => {
        this.salvando = false;
        this.toastService.sucesso(resposta.mensagem);
        this.fecharPacienteModal();
        this.carregarPacientes();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.toastService.erro(error.message || 'Nao foi possivel criar o paciente.');
      },
    });
  }

  private atualizarPaciente(pacienteId: string, payload: SalvarPacientePayload): void {
    this.salvando = true;

    this.pacientesService.editarPaciente(pacienteId, payload).subscribe({
      next: (resposta) => {
        this.salvando = false;
        this.toastService.sucesso(resposta.mensagem);
        this.fecharPacienteModal();
        this.carregarPacientes();
      },
      error: (error: Error) => {
        this.salvando = false;
        this.toastService.erro(error.message || 'Nao foi possivel atualizar o paciente.');
      },
    });
  }
}
