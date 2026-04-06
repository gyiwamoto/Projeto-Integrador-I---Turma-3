import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AgendaComponent } from './agenda.component';
import { AgendaService } from '../../services/agenda.service';
import { ToastService } from '../../services/toast.service';

describe('AgendaComponent', () => {
  let fixture: ComponentFixture<AgendaComponent>;
  let component: AgendaComponent;
  const agendaServiceSpy = {
    listarPacientes: vi.fn().mockReturnValue(of([])),
    listarConsultas: vi.fn().mockReturnValue(of([])),
    consultas: vi.fn().mockReturnValue([]),
    registrarAgendamentoLocal: vi.fn(),
  };
  const toastServiceSpy = {
    info: vi.fn(),
    sucesso: vi.fn(),
    erro: vi.fn(),
  };
  const activatedRouteSpy = {
    snapshot: {
      queryParamMap: {
        get: vi.fn().mockReturnValue(null),
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgendaComponent],
      providers: [
        provideRouter([]),
        { provide: AgendaService, useValue: agendaServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgendaComponent);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('altera modo de visualizacao', () => {
    component.selecionarModoVisualizacao('mes');
    expect(component.modoVisualizacao).toBe('mes');
  });

  it('abre modal de acao para slot livre no dia atual', () => {
    const hoje = new Date();
    component.selecionarDia(hoje.getDate(), hoje.getMonth(), hoje.getFullYear());
    component.consultas = [];

    component.clicarSlot(10, 0);

    expect(component.modalAcaoAberto).toBe(true);
  });
});
