import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UsuariosPage } from './usuarios.component';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';

describe('UsuariosPage', () => {
  let fixture: ComponentFixture<UsuariosPage>;
  let component: UsuariosPage;
  const authServiceSpy = {
    ehAdmin: vi.fn().mockReturnValue(true),
  };
  const usuariosServiceSpy = {
    listarUsuarios: vi.fn().mockReturnValue(of({ usuarios: [] })),
    criarUsuario: vi.fn(),
    editarUsuario: vi.fn(),
    excluirUsuario: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UsuariosService, useValue: usuariosServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosPage);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('abre modal para novo usuario', () => {
    component.abrirNovoUsuario();
    expect(component.modalUsuarioAberto).toBe(true);
    expect(component.modoFormulario).toBe('criar');
  });

  it('atualiza filtros no onFiltrosChange', () => {
    component.onFiltrosChange({ tipo_usuario: 'admin' });
    expect(component.filtros['tipo_usuario']).toBe('admin');
  });
});
