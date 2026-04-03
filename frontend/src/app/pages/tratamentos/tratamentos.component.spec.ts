import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TratamentosPage } from './tratamentos.component';
import { TratamentosService } from '../../services/tratamentos.service';

describe('TratamentosPage', () => {
  let fixture: ComponentFixture<TratamentosPage>;
  let component: TratamentosPage;
  const tratamentosServiceSpy = {
    listarTratamentos: vi.fn().mockReturnValue(of({ tratamentos: [] })),
    criarTratamento: vi.fn(),
    editarTratamento: vi.fn(),
    excluirTratamento: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TratamentosPage],
      providers: [{ provide: TratamentosService, useValue: tratamentosServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(TratamentosPage);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('abre modal para novo tratamento', () => {
    component.abrirNovoTratamento();
    expect(component.modalTratamentoAberto).toBe(true);
    expect(component.modoFormulario).toBe('criar');
  });

  it('atualiza filtros no onFiltrosChange', () => {
    component.onFiltrosChange({ ativo: 'sim' });
    expect(component.filtros['ativo']).toBe('sim');
  });
});
