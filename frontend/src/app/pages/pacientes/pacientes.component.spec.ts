import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { PacientesComponent } from './pacientes.component';
import { PacientesService } from '../../services/pacientes.service';
import { ConveniosService } from '../../services/convenios.service';
import { ToastService } from '../../services/toast.service';

describe('PacientesComponent', () => {
  let fixture: ComponentFixture<PacientesComponent>;
  let component: PacientesComponent;
  let router: Router;

  const pacientesServiceSpy = {
    listarPacientes: vi.fn().mockReturnValue(of({ pacientes: [] })),
    excluirPaciente: vi.fn(),
    criarPaciente: vi.fn(),
    editarPaciente: vi.fn(),
  };
  const conveniosServiceSpy = {
    listarConvenios: vi.fn().mockReturnValue(of({ convenios: [] })),
  };
  const toastServiceSpy = {
    sucesso: vi.fn(),
    erro: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PacientesComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => null } },
          },
        },
        { provide: PacientesService, useValue: pacientesServiceSpy },
        { provide: ConveniosService, useValue: conveniosServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PacientesComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('abre formulario de novo paciente', () => {
    component.abrirNovoPaciente();
    expect(component.pacienteModalAberto).toBe(true);
    expect(component.modoFormulario).toBe('criar');
  });

  it('executa acao de filtro para novo paciente', () => {
    component.onAcaoFiltro('novo-paciente');
    expect(component.pacienteModalAberto).toBe(true);
  });
});
