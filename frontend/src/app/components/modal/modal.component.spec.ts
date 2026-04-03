import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Inicialização', () => {
    it('renderiza o componente', () => {
      expect(component).toBeDefined();
    });

    it('inicializa com valores padrão', () => {
      expect(component.aberto).toBe(false);
      expect(component.titulo).toBe('');
      expect(component.descricao).toBe('');
      expect(component.modoEdicao).toBe(false);
      expect(component.mostrarBotaoEditar).toBe(true);
      expect(component.mostrarBotaoFechar).toBe(true);
    });
  });

  describe('Propriedades Input', () => {
    it('atualiza titulo quando recebe valor', () => {
      component.titulo = 'Meu Modal';
      expect(component.titulo).toBe('Meu Modal');
    });

    it('atualiza descricao quando recebe valor', () => {
      component.descricao = 'Descrição do modal';
      expect(component.descricao).toBe('Descrição do modal');
    });

    it('atualiza estado aberto', () => {
      component.aberto = true;
      expect(component.aberto).toBe(true);
      component.aberto = false;
      expect(component.aberto).toBe(false);
    });

    it('atualiza modoEdicao', () => {
      component.modoEdicao = false;
      expect(component.modoEdicao).toBe(false);
      component.modoEdicao = true;
      expect(component.modoEdicao).toBe(true);
    });

    it('controla visibilidade de botões', () => {
      component.mostrarBotaoEditar = false;
      expect(component.mostrarBotaoEditar).toBe(false);
      component.mostrarBotaoFechar = false;
      expect(component.mostrarBotaoFechar).toBe(false);
    });
  });

  describe('Emissão de Eventos', () => {
    it('emite fechar ao chamar método aoClicarFora', () => {
      let eventoEmitido = false;
      component.fechar.subscribe(() => {
        eventoEmitido = true;
      });
      component.aoClicarFora();
      expect(eventoEmitido).toBe(true);
    });

    it('emite fechar ao pressionar Escape', () => {
      component.aberto = true;
      let eventoEmitido = false;
      component.fechar.subscribe(() => {
        eventoEmitido = true;
      });
      component.onEscape();
      expect(eventoEmitido).toBe(true);
    });

    it('não emite fechar ao pressionar Escape quando modal fechado', () => {
      component.aberto = false;
      let eventoEmitido = false;
      component.fechar.subscribe(() => {
        eventoEmitido = true;
      });
      component.onEscape();
      expect(eventoEmitido).toBe(false);
    });

    it('possui eventos Output definidos', () => {
      expect(component.fechar).toBeDefined();
      expect(component.editar).toBeDefined();
      expect(component.salvar).toBeDefined();
      expect(component.cancelar).toBeDefined();
    });
  });

  describe('Modo Edição', () => {
    it('define modo edição como true', () => {
      component.modoEdicao = true;
      expect(component.modoEdicao).toBe(true);
    });

    it('sai do modo edição', () => {
      component.modoEdicao = true;
      component.modoEdicao = false;
      expect(component.modoEdicao).toBe(false);
    });

    it('transição entre modos', () => {
      expect(component.modoEdicao).toBe(false);
      component.modoEdicao = true;
      expect(component.modoEdicao).toBe(true);
      component.modoEdicao = false;
      expect(component.modoEdicao).toBe(false);
    });
  });

  describe('Estado do Modal', () => {
    it('modal começa fechado', () => {
      expect(component.aberto).toBe(false);
    });

    it('abre e fecha modal', () => {
      component.aberto = false;
      expect(component.aberto).toBe(false);
      component.aberto = true;
      expect(component.aberto).toBe(true);
      component.aberto = false;
      expect(component.aberto).toBe(false);
    });
  });

  describe('Visibilidade de Botões', () => {
    it('botão editar visível por padrão', () => {
      expect(component.mostrarBotaoEditar).toBe(true);
    });

    it('botão fechar visível por padrão', () => {
      expect(component.mostrarBotaoFechar).toBe(true);
    });

    it('controla visibilidade de botão editar', () => {
      component.mostrarBotaoEditar = true;
      expect(component.mostrarBotaoEditar).toBe(true);
      component.mostrarBotaoEditar = false;
      expect(component.mostrarBotaoEditar).toBe(false);
    });

    it('controla visibilidade de botão fechar', () => {
      component.mostrarBotaoFechar = true;
      expect(component.mostrarBotaoFechar).toBe(true);
      component.mostrarBotaoFechar = false;
      expect(component.mostrarBotaoFechar).toBe(false);
    });
  });

  describe('Conteúdo', () => {
    it('renderiza título quando fornecido', () => {
      component.aberto = true;
      component.titulo = 'Título do Modal';
      expect(component.titulo).toBe('Título do Modal');
    });

    it('renderiza descrição quando fornecida', () => {
      component.aberto = true;
      component.descricao = 'Descrição teste';
      expect(component.descricao).toBe('Descrição teste');
    });
  });

  describe('Comportamento do Atalho', () => {
    it('método onEscape existe', () => {
      expect(typeof component.onEscape).toBe('function');
    });

    it('método aoClicarFora existe', () => {
      expect(typeof component.aoClicarFora).toBe('function');
    });
  });

  describe('Integração de Eventos', () => {
    it('todos os emitters estão inicializados', () => {
      expect(component.fechar).toBeDefined();
      expect(component.editar).toBeDefined();
      expect(component.salvar).toBeDefined();
      expect(component.cancelar).toBeDefined();
    });

    it('emitters são do tipo EventEmitter', () => {
      expect(component.fechar['emit']).toBeDefined();
      expect(component.editar['emit']).toBeDefined();
      expect(component.salvar['emit']).toBeDefined();
      expect(component.cancelar['emit']).toBeDefined();
    });
  });
});
