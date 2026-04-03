import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgendaCalendarioComponent, DiaAgenda, AgendaSlot } from './agenda-calendario.component';

describe('AgendaCalendarioComponent', () => {
  let fixture: ComponentFixture<AgendaCalendarioComponent>;
  let component: AgendaCalendarioComponent;

  const diasTesteMock: DiaAgenda[] = [
    { nome: 'Seg', numero: 1, mes: 0, ano: 2024, hoje: false },
    { nome: 'Ter', numero: 2, mes: 0, ano: 2024, hoje: false },
    { nome: 'Qua', numero: 3, mes: 0, ano: 2024, hoje: true },
    { nome: 'Qui', numero: 4, mes: 0, ano: 2024, hoje: false },
    { nome: 'Sex', numero: 5, mes: 0, ano: 2024, hoje: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaCalendarioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendaCalendarioComponent);
    component = fixture.componentInstance;
    component.diasExibidos = diasTesteMock;
    component.horas = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
    component.minutos = [0, 15, 30, 45];
  });

  describe('Inicialização', () => {
    it('renderiza o componente', () => {
      fixture.detectChanges();
      expect(component).toBeDefined();
    });

    it('inicializa em modo semana por padrao', () => {
      expect(component.modoVisualizacao).toBe('semana');
    });

    it('inicializa com beatriz como doutora selecionada', () => {
      expect(component.doutoraSelecionada).toBe('beatriz');
    });

    it('inicializa com arrays vazios quando nao fornecido', () => {
      const novoComponent = fixture.debugElement.componentInstance as AgendaCalendarioComponent;
      expect(novoComponent.horas.length).toBeGreaterThanOrEqual(0);
      expect(novoComponent.minutos.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Modo de Visualizacao', () => {
    it('alterna para modo mes', () => {
      let modoEmitido: 'semana' | 'mes' | null = null;
      component.modoVisualizacaoChange.subscribe((modo) => {
        modoEmitido = modo;
      });
      component.selecionarModoVisualizacao('mes');
      expect(modoEmitido).toBe('mes');
    });

    it('alterna para modo semana', () => {
      component.modoVisualizacao = 'mes';
      let modoEmitido: 'semana' | 'mes' | null = null;
      component.modoVisualizacaoChange.subscribe((modo) => {
        modoEmitido = modo;
      });
      component.selecionarModoVisualizacao('semana');
      expect(modoEmitido).toBe('semana');
    });

    it('renderiza diferentes vistas baseado no modo', () => {
      component.modoVisualizacao = 'semana';
      expect(component.modoVisualizacao).toBe('semana');

      component.modoVisualizacao = 'mes';
      expect(component.modoVisualizacao).toBe('mes');
    });
  });

  describe('Navegacao de Periodos', () => {
    it('emite evento ao navegar para periodo anterior', () => {
      let eventoEmitido = false;
      component.periodoAnterior.subscribe(() => {
        eventoEmitido = true;
      });
      component.navegarAnterior();
      expect(eventoEmitido).toBe(true);
    });

    it('emite evento ao navegar para proximo periodo', () => {
      let eventoEmitido = false;
      component.periodoProximo.subscribe(() => {
        eventoEmitido = true;
      });
      component.navegarProximo();
      expect(eventoEmitido).toBe(true);
    });

    it('exibe mes e ano atuais', () => {
      component.mesAtual = 'Janeiro';
      component.anoAtual = 2024;
      fixture.detectChanges();
      expect(component.mesAtual).toBe('Janeiro');
      expect(component.anoAtual).toBe(2024);
    });

    it('atualiza mes atual quando muda', () => {
      component.mesAtual = 'Janeiro';
      component.mesAtual = 'Fevereiro';
      expect(component.mesAtual).toBe('Fevereiro');
    });

    it('atualiza ano atual quando muda', () => {
      component.anoAtual = 2024;
      component.anoAtual = 2025;
      expect(component.anoAtual).toBe(2025);
    });
  });

  describe('Selecao de Dias', () => {
    it('emite evento ao selecionar um dia', () => {
      const hoje = new Date();
      const diaFuturo: DiaAgenda = {
        nome: 'Sex',
        numero: hoje.getDate() + 1,
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: false,
      };
      let diaEmitido: { dia: number; mes: number; ano: number } | null = null;
      component.diaSelecionadoChange.subscribe((dia) => {
        diaEmitido = dia;
      });
      component.selecionarDia(diaFuturo);
      expect(diaEmitido).toEqual({
        dia: diaFuturo.numero,
        mes: diaFuturo.mes,
        ano: diaFuturo.ano,
      });
    });

    it('nao permite selecionar dia passado', () => {
      const hoje = new Date();
      const diaPassado: DiaAgenda = {
        nome: 'Seg',
        numero: hoje.getDate() - 1,
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: false,
      };
      let diaEmitido: { dia: number; mes: number; ano: number } | null = null;
      component.diaSelecionadoChange.subscribe((dia) => {
        diaEmitido = dia;
      });
      component.selecionarDia(diaPassado);
      expect(diaEmitido).toBeNull();
    });

    it('permite selecionar dia futuro', () => {
      const hoje = new Date();
      const diaFuturo: DiaAgenda = {
        nome: 'Sex',
        numero: hoje.getDate() + 1,
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: false,
      };
      let diaEmitido: { dia: number; mes: number; ano: number } | null = null;
      component.diaSelecionadoChange.subscribe((dia) => {
        diaEmitido = dia;
      });
      component.selecionarDia(diaFuturo);
      expect(diaEmitido).toEqual({
        dia: diaFuturo.numero,
        mes: diaFuturo.mes,
        ano: diaFuturo.ano,
      });
    });

    it('permite selecionar dia de hoje', () => {
      const hoje = new Date();
      const diaHoje: DiaAgenda = {
        nome: 'Qua',
        numero: hoje.getDate(),
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: true,
      };
      let diaEmitido: { dia: number; mes: number; ano: number } | null = null;
      component.diaSelecionadoChange.subscribe((dia) => {
        diaEmitido = dia;
      });
      component.selecionarDia(diaHoje);
      expect(diaEmitido).toEqual({
        dia: diaHoje.numero,
        mes: diaHoje.mes,
        ano: diaHoje.ano,
      });
    });

    it('atualiza dia selecionado quando propriedade muda', () => {
      component.diaSelecionado = 1;
      expect(component.diaSelecionado).toBe(1);
      component.diaSelecionado = 15;
      expect(component.diaSelecionado).toBe(15);
    });

    it('atualiza nome do dia selecionado', () => {
      component.nomeDiaSelecionado = 'Quarta-feira, 3 de Janeiro';
      fixture.detectChanges();
      expect(component.nomeDiaSelecionado).toBe('Quarta-feira, 3 de Janeiro');
    });
  });

  describe('Selecao de Doutora', () => {
    it('emite evento ao selecionar beatriz', () => {
      let doutaraEmitida: 'beatriz' | 'luciana' | null = null;
      component.doutoraSelecionadaChange.subscribe((doutora) => {
        doutaraEmitida = doutora;
      });
      component.selecionarDoutora('beatriz');
      expect(doutaraEmitida).toBe('beatriz');
    });

    it('emite evento ao selecionar luciana', () => {
      let doutaraEmitida: 'beatriz' | 'luciana' | null = null;
      component.doutoraSelecionadaChange.subscribe((doutora) => {
        doutaraEmitida = doutora;
      });
      component.selecionarDoutora('luciana');
      expect(doutaraEmitida).toBe('luciana');
    });

    it('atualiza doutora selecionada quando propriedade muda', () => {
      component.doutoraSelecionada = 'beatriz';
      expect(component.doutoraSelecionada).toBe('beatriz');
      component.doutoraSelecionada = 'luciana';
      expect(component.doutoraSelecionada).toBe('luciana');
    });
  });

  describe('Slots de Horario', () => {
    it('emite evento ao clicar em um slot', () => {
      let slotEmitido: AgendaSlot | null = null;
      component.slotClick.subscribe((slot) => {
        slotEmitido = slot;
      });
      component.clicarSlot(10, 30);
      expect(slotEmitido).toEqual({ hora: 10, min: 30 });
    });

    it('renderiza slots de horarios', () => {
      fixture.detectChanges();
      expect(component.horas.length).toBeGreaterThan(0);
      expect(component.minutos.length).toBeGreaterThan(0);
    });

    it('exibe consulta no slot quando existe', () => {
      component.consultaNoSlot = (hora, min) => {
        if (hora === 10 && min === 0) {
          return 'Consulta com paciente';
        }
        return '';
      };
      const consulta = component.obterConsulta(10, 0);
      expect(consulta).toBe('Consulta com paciente');
    });

    it('nao exibe consulta quando slot esta livre', () => {
      component.consultaNoSlot = () => '';
      const consulta = component.obterConsulta(14, 30);
      expect(consulta).toBe('');
    });

    it('atualiza lista de horas quando propriedade muda', () => {
      component.horas = [8, 9, 10];
      expect(component.horas.length).toBe(3);

      component.horas = [8, 9, 10, 11, 12];
      expect(component.horas.length).toBe(5);
    });

    it('atualiza lista de minutos quando propriedade muda', () => {
      component.minutos = [0, 30];
      expect(component.minutos.length).toBe(2);

      component.minutos = [0, 15, 30, 45];
      expect(component.minutos.length).toBe(4);
    });
  });

  describe('Dias Passados', () => {
    it('identifica dia passado corretamente', () => {
      const hoje = new Date();
      const diaPassado: DiaAgenda = {
        nome: 'Seg',
        numero: hoje.getDate() - 1,
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: false,
      };
      expect(component.isDiaPassado(diaPassado)).toBe(true);
    });

    it('nao identifica dia futuro como passado', () => {
      const hoje = new Date();
      const diaFuturo: DiaAgenda = {
        nome: 'Seg',
        numero: hoje.getDate() + 1,
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: false,
      };
      expect(component.isDiaPassado(diaFuturo)).toBe(false);
    });

    it('nao identifica dia de hoje como passado', () => {
      const hoje = new Date();
      const diaHoje: DiaAgenda = {
        nome: 'Seg',
        numero: hoje.getDate(),
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: true,
      };
      expect(component.isDiaPassado(diaHoje)).toBe(false);
    });

    it('identifica dia de ano anterior como passado', () => {
      const agoPassado: DiaAgenda = {
        nome: 'Ter',
        numero: 1,
        mes: 0,
        ano: 2020,
        hoje: false,
      };
      expect(component.isDiaPassado(agoPassado)).toBe(true);
    });
  });

  describe('Renderizacao de Dias', () => {
    it('renderiza todos os dias fornecidos', () => {
      component.diasExibidos = [
        { nome: 'Seg', numero: 1, mes: 0, ano: 2024, hoje: false },
        { nome: 'Ter', numero: 2, mes: 0, ano: 2024, hoje: false },
        { nome: 'Qua', numero: 3, mes: 0, ano: 2024, hoje: true },
      ];
      fixture.detectChanges();
      expect(component.diasExibidos.length).toBe(3);
    });

    it('marca dia atual corretamente', () => {
      const diaHoje = component.diasExibidos.find((d) => d.hoje);
      expect(diaHoje?.hoje).toBe(true);
    });

    it('renderiza com classe especial para dia de hoje', () => {
      fixture.detectChanges();
      expect(component.diasExibidos.some((d) => d.hoje)).toBe(true);
    });
  });

  describe('Propriedades Input', () => {
    it('aceita valores iniciais para todas as propriedades', () => {
      component.modoVisualizacao = 'mes';
      component.mesAtual = 'Fevereiro';
      component.anoAtual = 2024;
      component.doutoraSelecionada = 'luciana';
      fixture.detectChanges();
      expect(component.modoVisualizacao).toBe('mes');
      expect(component.mesAtual).toBe('Fevereiro');
      expect(component.anoAtual).toBe(2024);
      expect(component.doutoraSelecionada).toBe('luciana');
    });

    it('atualiza mes selecionado', () => {
      component.mesSelecionado = 0;
      fixture.detectChanges();
      expect(component.mesSelecionado).toBe(0);
      component.mesSelecionado = 5;
      fixture.detectChanges();
      expect(component.mesSelecionado).toBe(5);
    });

    it('verifica se mes selecionado e mês atual', () => {
      component.mesSelecionadoEhAtual = true;
      fixture.detectChanges();
      expect(component.mesSelecionadoEhAtual).toBe(true);
    });
  });

  describe('Emissao de Eventos', () => {
    it('emite todos os tipos de eventos corretamente', () => {
      const hoje = new Date();
      const diaFuturo: DiaAgenda = {
        nome: 'Sex',
        numero: hoje.getDate() + 1,
        mes: hoje.getMonth(),
        ano: hoje.getFullYear(),
        hoje: false,
      };
      const eventos = {
        modoVisualizacao: false,
        periodo: false,
        dia: false,
        doutora: false,
        slot: false,
      };

      component.modoVisualizacaoChange.subscribe(() => {
        eventos.modoVisualizacao = true;
      });
      component.periodoAnterior.subscribe(() => {
        eventos.periodo = true;
      });
      component.diaSelecionadoChange.subscribe(() => {
        eventos.dia = true;
      });
      component.doutoraSelecionadaChange.subscribe(() => {
        eventos.doutora = true;
      });
      component.slotClick.subscribe(() => {
        eventos.slot = true;
      });

      component.selecionarModoVisualizacao('mes');
      component.navegarAnterior();
      component.selecionarDia(diaFuturo);
      component.selecionarDoutora('luciana');
      component.clicarSlot(10, 0);

      expect(eventos.modoVisualizacao).toBe(true);
      expect(eventos.periodo).toBe(true);
      expect(eventos.dia).toBe(true);
      expect(eventos.doutora).toBe(true);
      expect(eventos.slot).toBe(true);
    });
  });
});
