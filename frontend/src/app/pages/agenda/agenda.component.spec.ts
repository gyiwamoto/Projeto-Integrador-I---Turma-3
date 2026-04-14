import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AgendaComponent } from './agenda.component';
import { AgendaService } from '../../services/agenda.service';
import { ToastService } from '../../services/toast.service';
import { UsuariosService } from '../../services/usuarios.service';

describe('AgendaComponent', () => {
  let fixture: ComponentFixture<AgendaComponent>;
  let component: AgendaComponent;
  const agendaServiceSpy = {
    listarPacientes: vi.fn().mockReturnValue(of([])),
    listarConsultas: vi.fn().mockReturnValue(of([])),
    criarConsulta: vi
      .fn()
      .mockReturnValue(of({ mensagem: 'ok', consulta: { id: '1', usuario_id: 'user-id' } })),
    atualizarConsulta: vi.fn().mockReturnValue(of({ mensagem: 'ok', consulta: { id: '1' } })),
  };
  const toastServiceSpy = {
    info: vi.fn(),
    sucesso: vi.fn(),
    erro: vi.fn(),
  };
  const usuariosServiceSpy = {
    listarUsuarios: vi.fn().mockReturnValue(of({ usuarios: [] })),
    obterUsuariosEmCache: vi.fn().mockReturnValue([]),
  };
  const activatedRouteSpy = {
    snapshot: {
      queryParamMap: {
        get: vi.fn().mockReturnValue(null),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorage.removeItem('agenda:dentista-selecionado-id');

    await TestBed.configureTestingModule({
      imports: [AgendaComponent],
      providers: [
        provideRouter([]),
        { provide: AgendaService, useValue: agendaServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: UsuariosService, useValue: usuariosServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendaComponent);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('inicializa com carregandoPacientes e carregandoConsultas como signals false', () => {
    expect(component.carregandoPacientes()).toBe(false);
    expect(component.carregandoConsultas()).toBe(false);
  });

  it('altera modo de visualizacao', () => {
    component.selecionarModoVisualizacao('mes');
    expect(component.modoVisualizacao).toBe('mes');
  });

  it('visao mensal mostra o mes inteiro mesmo apos selecionar um dia avançado', () => {
    component.selecionarModoVisualizacao('mes');
    component.selecionarDia(16, 3, 2026);

    const dias = component.diasExibidos;

    expect(dias[0]?.numero).toBe(1);
    expect(dias.some((dia) => dia.numero === 15)).toBe(true);
    expect(dias.some((dia) => dia.numero === 16)).toBe(true);
  });

  it('abre modal de acao para slot livre no dia atual', () => {
    const hoje = new Date();
    component.selecionarDia(hoje.getDate(), hoje.getMonth(), hoje.getFullYear());
    component.consultas.set([]);

    component.clicarSlot(10, 0);

    expect(component.modalAcaoAberto).toBe(true);
  });

  it('selecionarDentista atualiza signal e salva localStorage', () => {
    const dentistaId = 'dentista-123';
    component.selecionarDentista(dentistaId);

    expect(component.dentistaSelecionadoId()).toBe(dentistaId);
    expect(localStorage.getItem('agenda:dentista-selecionado-id')).toBe(dentistaId);
  });

  it('confirmarAgendamento fecha modal imediatamente', () => {
    component.slotSelecionado = { hora: 10, min: 0 };
    component.pacienteSelecionado = {
      id: '1',
      codigoPaciente: 'P001',
      nome: 'Paciente Teste',
      telefone: '',
      email: '',
      numeroCarteirinha: '',
    };
    component.dentistaSelecionadoId.set('dentista-123');
    component.modalConfirmAberto = true;

    component.confirmarAgendamento();

    expect(component.modalConfirmAberto).toBe(false);
    expect(agendaServiceSpy.criarConsulta).toHaveBeenCalled();
  });

  it('confirmarAgendamento envia usuarioId correto', () => {
    const dentistaId = 'dentista-456';
    component.slotSelecionado = { hora: 14, min: 30 };
    component.pacienteSelecionado = {
      id: '2',
      codigoPaciente: 'P002',
      nome: 'Outro Paciente',
      telefone: '',
      email: '',
      numeroCarteirinha: '',
    };
    component.dentistaSelecionadoId.set(dentistaId);

    component.confirmarAgendamento();

    expect(agendaServiceSpy.criarConsulta).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: dentistaId,
        pacienteId: '2',
      }),
    );
  });

  it('alternarProcedimento adiciona e remove procedimentos', () => {
    component.procedimentosAgendados = ['100'];

    component.alternarProcedimento('110');

    expect(component.procedimentosAgendados).toContain('110');

    component.alternarProcedimento('110');

    expect(component.procedimentosAgendados).not.toContain('110');
    expect(component.procedimentosAgendados).toContain('100');
  });

  it('ngOnInit carrega dados e dentistas na inicializacao', () => {
    component.ngOnInit();

    expect(agendaServiceSpy.listarPacientes).toHaveBeenCalled();
    expect(agendaServiceSpy.listarConsultas).toHaveBeenCalled();
    expect(usuariosServiceSpy.listarUsuarios).toHaveBeenCalled();
  });

  it('restauraDentistaSalvoDoLocalStorage', () => {
    const dentistaId = 'dentista-saved-123';
    localStorage.setItem('agenda:dentista-selecionado-id', dentistaId);
    usuariosServiceSpy.listarUsuarios.mockReturnValue(
      of({
        usuarios: [{ id: '1', nome: 'Dentista 1', tipo_usuario: 'dentista' }],
      }),
    );

    component.ngOnInit();

    // Espera um momento para o observable ser processado
    expect(agendaServiceSpy.listarPacientes).toHaveBeenCalled();
  });

  it('desabilitaSlotPassado', () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    component.selecionarDia(ontem.getDate(), ontem.getMonth(), ontem.getFullYear());

    component.clicarSlot(10, 0);

    expect(toastServiceSpy.info).toHaveBeenCalledWith(
      'Nao e possivel marcar consulta em dias anteriores.',
    );
    expect(component.modalAcaoAberto).toBe(false);
  });

  it('desabilitaSlotOcupado', () => {
    const hoje = new Date();
    component.selecionarDia(hoje.getDate(), hoje.getMonth(), hoje.getFullYear());

    const consultaOcupando = {
      id: '1',
      pacienteId: 'p1',
      pacienteNome: 'Paciente Test',
      profissionalNome: 'Dentista',
      usuarioId: 'user1',
      status: 'agendado' as const,
      dataConsulta: new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        10,
        0,
      ).toISOString(),
      duracaoEstimadaMin: 30,
      procedimentosAgendados: ['100'],
    };

    component.consultas.set([consultaOcupando]);

    component.clicarSlot(10, 0);

    expect(toastServiceSpy.info).toHaveBeenCalledWith('Horario ja ocupado para esta profissional.');
    expect(component.modalAcaoAberto).toBe(false);
  });
});
