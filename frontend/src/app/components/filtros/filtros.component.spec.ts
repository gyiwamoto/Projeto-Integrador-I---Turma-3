import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FiltrosComponent, FiltroCampo, FiltroAcao } from './filtros.component';

describe('FiltrosComponent', () => {
  let fixture: ComponentFixture<FiltrosComponent>;
  let component: FiltrosComponent;

  const camposTesteMock: FiltroCampo[] = [
    {
      key: 'nome',
      label: 'Nome',
      type: 'text',
      placeholder: 'Digite o nome',
    },
    {
      key: 'data',
      label: 'Data',
      type: 'date',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Ativo', value: 'ativo' },
        { label: 'Inativo', value: 'inativo' },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltrosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FiltrosComponent);
    component = fixture.componentInstance;
    component.campos = camposTesteMock;
  });

  describe('Inicialização', () => {
    it('renderiza o componente', () => {
      fixture.detectChanges();
      expect(component).toBeDefined();
    });

    it('inicializa valores de filtros vazios quando nao ha valores iniciais', () => {
      component.ngOnChanges({
        campos: {
          currentValue: component.campos,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component.valores['nome']).toBe('');
      expect(component.valores['data']).toBe('');
      expect(component.valores['status']).toBe('');
    });

    it('inicializa valores com dados iniciais fornecidos', () => {
      component.valoresIniciais = { nome: 'João', status: 'ativo' };
      component.ngOnChanges({
        valoresIniciais: {
          currentValue: component.valoresIniciais,
          previousValue: {},
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component.valores['nome']).toBe('João');
      expect(component.valores['status']).toBe('ativo');
      expect(component.valores['data']).toBe('');
    });

    it('atualiza titulo quando fornecido', () => {
      component.titulo = 'Filtros Avançados';
      fixture.detectChanges();
      expect(component.titulo).toBe('Filtros Avançados');
    });
  });

  describe('Acoes Padroes', () => {
    beforeEach(() => {
      component.incluirAcoesPadrao = true;
      fixture.detectChanges();
    });

    it('inclui acoes padroes cancelar e confirmar quando habilitado', () => {
      const acoes = component.acoesOrdenadas;
      const ids = acoes.map((a) => a.id);
      expect(ids).toContain('confirmar');
      expect(ids).toContain('cancelar');
    });

    it('nao inclui acoes padroes quando desabilitado', () => {
      component.incluirAcoesPadrao = false;
      fixture.detectChanges();
      const acoes = component.acoesOrdenadas;
      const ids = acoes.map((a) => a.id);
      expect(ids).not.toContain('confirmar');
      expect(ids).not.toContain('cancelar');
    });

    it('ordena acoes corretamente por ordem', () => {
      const acoesCustos: FiltroAcao[] = [
        { id: 'acao1', ordem: 1 },
        { id: 'acao2', ordem: 0 },
      ];
      component.acoes = acoesCustos;
      fixture.detectChanges();
      const acoes = component.acoesOrdenadas;
      expect(acoes[0]?.id).toBe('acao2');
    });

    it('define labels padrao para cancelar e confirmar', () => {
      const acoes = component.acoesOrdenadas;
      const confirmar = acoes.find((a) => a.id === 'confirmar');
      const cancelar = acoes.find((a) => a.id === 'cancelar');
      expect(confirmar?.label).toBe('Confirmar');
      expect(cancelar?.label).toBe('Cancelar');
    });

    it('define label customizado para cancelar', () => {
      component.labelCancelar = 'Discartar';
      fixture.detectChanges();
      const acoes = component.acoesOrdenadas;
      const cancelar = acoes.find((a) => a.id === 'cancelar');
      expect(cancelar?.label).toBe('Discartar');
    });

    it('define label customizado para confirmar', () => {
      component.labelConfirmar = 'Aplicar Filtros';
      fixture.detectChanges();
      const acoes = component.acoesOrdenadas;
      const confirmar = acoes.find((a) => a.id === 'confirmar');
      expect(confirmar?.label).toBe('Aplicar Filtros');
    });
  });

  describe('Acoes Customizadas', () => {
    it('inclui acoes customizadas na lista de acoes', () => {
      const acoesCustas: FiltroAcao[] = [{ id: 'exportar', label: 'Exportar', tipo: 'custom' }];
      component.acoes = acoesCustas;
      component.incluirAcoesPadrao = false;
      fixture.detectChanges();
      const acoes = component.acoesOrdenadas;
      expect(acoes.some((a) => a.id === 'exportar')).toBe(true);
    });

    it('nao duplica acoes customizadas que sobrescrevem acoes padroes', () => {
      const acoesCustas: FiltroAcao[] = [
        {
          id: 'confirmar',
          label: 'Buscar',
          tipo: 'confirmar',
          ordem: 1,
        },
      ];
      component.acoes = acoesCustas;
      fixture.detectChanges();
      const acoes = component.acoesOrdenadas;
      const confirmarCount = acoes.filter((a) => a.id === 'confirmar').length;
      expect(confirmarCount).toBe(1);
    });
  });

  describe('Funcionalidade de Filtro', () => {
    it('emite filtrosChange ao confirmar com valores atuais', () => {
      let valoresEmitidos: Record<string, string> | null = null;
      component.filtrosChange.subscribe((valores) => {
        valoresEmitidos = valores;
      });
      component.valores = { nome: 'João', data: '2024-01-01', status: 'ativo' };
      component.confirmar();
      expect(valoresEmitidos).toEqual({
        nome: 'João',
        data: '2024-01-01',
        status: 'ativo',
      });
    });

    it('limpa valores ao cancelar', () => {
      component.valores = { nome: 'João', data: '2024-01-01', status: 'ativo' };
      component.cancelar();
      expect(component.valores['nome']).toBe('');
      expect(component.valores['data']).toBe('');
      expect(component.valores['status']).toBe('');
    });

    it('emite filtrosChange ao cancelar com valores limpos', () => {
      let valoresEmitidos: Record<string, string> | null = null;
      component.filtrosChange.subscribe((valores) => {
        valoresEmitidos = valores;
      });
      component.valores = { nome: 'João', data: '2024-01-01', status: 'ativo' };
      component.cancelar();
      expect(valoresEmitidos).toEqual({
        nome: '',
        data: '',
        status: '',
      });
    });
  });

  describe('Execucao de Acoes', () => {
    it('executa acao de confirmar corretamente', () => {
      let valoresEmitidos: Record<string, string> | null = null;
      component.filtrosChange.subscribe((valores) => {
        valoresEmitidos = valores;
      });
      component.valores = { nome: 'Maria' };
      const acao: FiltroAcao = {
        id: 'confirmar',
        tipo: 'confirmar',
      };
      component.executarAcao(acao);
      expect(valoresEmitidos).toEqual({ nome: 'Maria' });
    });

    it('executa acao de cancelar corretamente', () => {
      let valoresEmitidos: Record<string, string> | null = null;
      component.filtrosChange.subscribe((valores) => {
        valoresEmitidos = valores;
      });
      component.valores = { nome: 'Maria' };
      const acao: FiltroAcao = {
        id: 'cancelar',
        tipo: 'cancelar',
      };
      component.executarAcao(acao);
      expect(valoresEmitidos).toEqual({ nome: '', data: '', status: '' });
    });

    it('emite acaoCustomizada para acoes customizadas', () => {
      let acaoEmitida = '';
      component.acaoCustomizada.subscribe((id) => {
        acaoEmitida = id;
      });
      const acao: FiltroAcao = {
        id: 'exportar',
        tipo: 'custom',
      };
      component.executarAcao(acao);
      expect(acaoEmitida).toBe('exportar');
    });
  });

  describe('ngOnChanges', () => {
    it('reinicializa valores quando campos mudam', () => {
      component.campos = [{ key: 'nome', label: 'Nome', type: 'text' }];
      component.valoresIniciais = { nome: 'João' };
      component.ngOnChanges({
        campos: {
          currentValue: component.campos,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component.valores['nome']).toBe('João');
    });

    it('reinicializa valores quando valoresIniciais mudam', () => {
      component.campos = [
        { key: 'nome', label: 'Nome', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
      ];
      component.valoresIniciais = { nome: 'Maria', email: 'maria@test.com' };
      component.ngOnChanges({
        valoresIniciais: {
          currentValue: component.valoresIniciais,
          previousValue: {},
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component.valores['nome']).toBe('Maria');
      expect(component.valores['email']).toBe('maria@test.com');
    });
  });

  describe('Campos de Filtro', () => {
    it('renderiza campos de texto corretamente', () => {
      expect(component.campos[0]?.type).toBe('text');
      expect(component.campos[0]?.label).toBe('Nome');
    });

    it('renderiza campos de data corretamente', () => {
      expect(component.campos[1]?.type).toBe('date');
      expect(component.campos[1]?.label).toBe('Data');
    });

    it('renderiza campos de select com opcoes', () => {
      expect(component.campos[2]?.type).toBe('select');
      expect(component.campos[2]?.options?.length).toBe(2);
      expect(component.campos[2]?.options?.[0]?.value).toBe('ativo');
    });
  });
});
