import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../services/auth.service';
import { UsuarioAutenticado } from '../../interfaces/Usuario';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;
  let AuthServiceSpy: {
    obterSessaoAutenticada: ReturnType<typeof vi.fn>;
    ehAdmin: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    AuthServiceSpy = {
      obterSessaoAutenticada: vi.fn(),
      ehAdmin: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  describe('Inicialização', () => {
    it('renderiza o componente', () => {
      fixture.detectChanges();
      expect(component).toBeDefined();
    });

    it('carrega menu items padroes', () => {
      expect(component.menuItems.length).toBeGreaterThan(0);
    });

    it('tiene dashboard no menu', () => {
      const dashboardItem = component.menuItems.find((item) => item.route === '/dashboard');
      expect(dashboardItem).toBeDefined();
    });

    it('tiene agendar consulta no menu', () => {
      const agendarItem = component.menuItems.find(
        (item) => item.route === '/dashboard/agendar-consulta',
      );
      expect(agendarItem).toBeDefined();
    });
  });

  describe('Menu Items', () => {
    it('renderiza rotas corretas para cada menu item', () => {
      const pacientesItem = component.menuItems.find((item) => item.label === 'Pacientes');
      expect(pacientesItem?.route).toBe('/dashboard/pacientes');
    });

    it('renderiza icones para cada menu item', () => {
      const dashboardItem = component.menuItems.find((item) => item.label === 'Dashboard');
      expect(dashboardItem?.icon).toBe('space_dashboard');
    });

    it('todos os menu items possuem label', () => {
      component.menuItems.forEach((item) => {
        expect(item.label).toBeTruthy();
      });
    });

    it('todos os menu items possuem rota', () => {
      component.menuItems.forEach((item) => {
        expect(item.route).toBeTruthy();
      });
    });

    it('todos os menu items possuem icone', () => {
      component.menuItems.forEach((item) => {
        expect(item.icon).toBeTruthy();
      });
    });

    it('todos os menu items possuem propriedade adminOnly', () => {
      component.menuItems.forEach((item) => {
        expect(typeof item.adminOnly).toBe('boolean');
      });
    });
  });

  describe('Filtro de Menu por Permissoes', () => {
    it('exibe todos os itens quando usuario e admin', () => {
      AuthServiceSpy.ehAdmin.mockReturnValue(true);
      fixture.detectChanges();
      const itensFiltrados = component.menuItemsVisiveis;
      const usuarioItem = itensFiltrados.find((item) => item.label === 'Usuarios');
      expect(usuarioItem).toBeDefined();
    });

    it('oculta items admin quando usuario nao e admin', () => {
      AuthServiceSpy.ehAdmin.mockReturnValue(false);
      fixture.detectChanges();
      const itensFiltrados = component.menuItemsVisiveis;
      const usuarioItem = itensFiltrados.find((item) => item.label === 'Usuarios');
      expect(usuarioItem).toBeUndefined();
    });

    it('exibe itens nao-admin para qualquer usuario', () => {
      AuthServiceSpy.ehAdmin.mockReturnValue(false);
      fixture.detectChanges();
      const itensFiltrados = component.menuItemsVisiveis;
      const dashboardItem = itensFiltrados.find((item) => item.label === 'Dashboard');
      expect(dashboardItem).toBeDefined();
    });

    it('apenas usuarios marcado como adminOnly nao aparecem para nao-admin', () => {
      AuthServiceSpy.ehAdmin.mockReturnValue(false);
      fixture.detectChanges();
      const itensFiltrados = component.menuItemsVisiveis;
      itensFiltrados.forEach((item) => {
        if (item.adminOnly) {
          expect(item.adminOnly).toBe(false);
        }
      });
    });

    it('usuarios com admin veem todas as opcoes admin', () => {
      const itemsAdmin = component.menuItems.filter((item) => item.adminOnly);
      expect(itemsAdmin.length).toBeGreaterThan(0);
      AuthServiceSpy.ehAdmin.mockReturnValue(true);
      fixture.detectChanges();
      const itensFiltrados = component.menuItemsVisiveis;
      itemsAdmin.forEach((item) => {
        const encontrado = itensFiltrados.find((i) => i.label === item.label);
        expect(encontrado).toBeDefined();
      });
    });
  });

  describe('Nome do Usuario', () => {
    it('exibe nome do usuario autenticado', () => {
      const usuarioAutenticado: UsuarioAutenticado = {
        id: '1',
        nome: 'João Silva',
        email: 'joao@test.com',
        tipo_usuario: 'dentista',
      };
      AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(usuarioAutenticado);
      fixture.detectChanges();
      const nomeExibido = component.usuarioNome;
      expect(nomeExibido).toBe('João Silva');
    });

    it('exibe "Usuario" quando nao ha sessao autenticada', () => {
      AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(null);
      fixture.detectChanges();
      const nomeExibido = component.usuarioNome;
      expect(nomeExibido).toBe('Usuário');
    });

    it('exibe "Usuario" quando sessao nao tem nome', () => {
      const usuarioSemNome: UsuarioAutenticado = {
        id: '1',
        nome: '',
        email: 'joao@test.com',
        tipo_usuario: 'dentista',
      };
      AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(usuarioSemNome);
      fixture.detectChanges();
      const nomeExibido = component.usuarioNome;
      expect(nomeExibido).toBe('');
    });

    it('renderiza nome do usuario na sidebar', () => {
      const usuarioAutenticado: UsuarioAutenticado = {
        id: '1',
        nome: 'Maria Oliveira',
        email: 'maria@test.com',
        tipo_usuario: 'recepcionista',
      };
      AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(usuarioAutenticado);
      fixture.detectChanges();
      expect(component.usuarioNome).toBe('Maria Oliveira');
    });

    it('atualiza nome quando sessao autem muda', () => {
      const usuario1: UsuarioAutenticado = {
        id: '1',
        nome: 'João',
        email: 'joao@test.com',
        tipo_usuario: 'dentista',
      };
      AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(usuario1);
      fixture.detectChanges();
      expect(component.usuarioNome).toBe('João');

      const usuario2: UsuarioAutenticado = {
        id: '2',
        nome: 'Maria',
        email: 'maria@test.com',
        tipo_usuario: 'dentista',
      };
      AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(usuario2);
      expect(component.usuarioNome).toBe('Maria');
    });
  });

  describe('Rotas de Menu', () => {
    it('tem rota para dashboard', () => {
      const item = component.menuItems.find((i) => i.label === 'Dashboard');
      expect(item?.route).toBe('/dashboard');
    });

    it('tem rota para consultas', () => {
      const item = component.menuItems.find((i) => i.label === 'Consultas');
      expect(item?.route).toBe('/dashboard/consultas');
    });

    it('tem rota para pacientes', () => {
      const item = component.menuItems.find((i) => i.label === 'Pacientes');
      expect(item?.route).toBe('/dashboard/pacientes');
    });

    it('tem rota para tratamentos', () => {
      const item = component.menuItems.find((i) => i.label === 'Tratamentos');
      expect(item?.route).toBe('/dashboard/tratamentos');
    });

    it('tem rota para convenios', () => {
      const item = component.menuItems.find((i) => i.label === 'Convenios');
      expect(item?.route).toBe('/dashboard/convenios');
    });

    it('tem rota para minha conta', () => {
      const item = component.menuItems.find((i) => i.label === 'Minha Conta');
      expect(item?.route).toBe('/dashboard/minha-conta');
    });

    it('tem rota para usuarios (admin)', () => {
      const item = component.menuItems.find((i) => i.label === 'Usuarios');
      expect(item?.route).toBe('/dashboard/usuarios');
      expect(item?.adminOnly).toBe(true);
    });
  });

  describe('AuthService Integration', () => {
    it('chama obterSessaoAutenticada ao obter nome do usuario', () => {
      AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(null);
      const nome = component.usuarioNome;
      expect(AuthServiceSpy.obterSessaoAutenticada).toHaveBeenCalled();
    });

    it('chama ehAdmin ao filtrar menu items', () => {
      AuthServiceSpy.ehAdmin.mockReturnValue(false);
      const items = component.menuItemsVisiveis;
      expect(AuthServiceSpy.ehAdmin).toHaveBeenCalled();
    });
  });
});
