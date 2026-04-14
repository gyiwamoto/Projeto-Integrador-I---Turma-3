import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConsultasComponent } from './consultas.component';
import { AgendaService } from '../../services/agenda.service';
import { ToastService } from '../../services/toast.service';

describe('ConsultasComponent', () => {
  let fixture: ComponentFixture<ConsultasComponent>;
  let component: ConsultasComponent;
  const agendaServiceSpy = {
    listarConsultas: vi.fn().mockReturnValue(of([])),
    listarPacientes: vi.fn().mockReturnValue(of([])),
  };
  const toastServiceSpy = {
    erro: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultasComponent],
      providers: [
        { provide: AgendaService, useValue: agendaServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultasComponent);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('carrega dados no ngOnInit', () => {
    component.ngOnInit();
    expect(agendaServiceSpy.listarConsultas).toHaveBeenCalled();
  });

  it('atualiza filtros no onFiltrosChange', () => {
    component.onFiltrosChange({ paciente: 'maria' });
    expect(component.filtros['paciente']).toBe('maria');
  });
});
