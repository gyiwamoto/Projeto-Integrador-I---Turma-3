import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ConveniosPage } from './convenios.component';
import { ConveniosService } from '../../services/convenios.service';

describe('ConveniosPage', () => {
  let fixture: ComponentFixture<ConveniosPage>;
  let component: ConveniosPage;
  const conveniosServiceSpy = {
    listarConvenios: vi.fn().mockReturnValue(of({ convenios: [] })),
    criarConvenio: vi.fn(),
    editarConvenio: vi.fn(),
    excluirConvenio: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConveniosPage],
      providers: [{ provide: ConveniosService, useValue: conveniosServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ConveniosPage);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('abre modal para criar convenio', () => {
    component.abrirNovoConvenio();
    expect(component.modalConvenioAberto).toBe(true);
    expect(component.modoFormulario).toBe('criar');
  });

  it('atualiza filtros no onFiltrosChange', () => {
    component.onFiltrosChange({ busca: 'odonto' });
    expect(component.filtros['busca']).toBe('odonto');
  });
});
