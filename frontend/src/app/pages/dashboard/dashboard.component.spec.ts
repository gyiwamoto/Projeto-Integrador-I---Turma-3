import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';
import { AgendaService } from '../../services/agenda.service';
import { PacientesService } from '../../services/pacientes.service';
import { ProcedimentosRealizadosService } from '../../services/procedimentos-realizados.service';
import { of } from 'rxjs';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  const authServiceSpy = {
    obterSessaoAutenticada: vi.fn(),
  };
  const agendaServiceSpy = {
    listarConsultas: vi.fn().mockReturnValue(of([])),
  };
  const pacientesServiceSpy = {
    listarPacientes: vi.fn().mockReturnValue(of({ total: 0, pacientes: [] })),
  };
  const procedimentosServiceSpy = {
    listarProcedimentosRealizados: vi
      .fn()
      .mockReturnValue(of({ total: 0, procedimentos_realizados: [] })),
  };

  beforeEach(async () => {
    authServiceSpy.obterSessaoAutenticada.mockReturnValue({ nome: 'Equipe' });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AgendaService, useValue: agendaServiceSpy },
        { provide: PacientesService, useValue: pacientesServiceSpy },
        { provide: ProcedimentosRealizadosService, useValue: procedimentosServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('retorna nome do usuario autenticado', () => {
    authServiceSpy.obterSessaoAutenticada.mockReturnValue({ nome: 'Ana' });
    expect(component.nomeUsuario).toBe('Ana');
  });
});
