import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MinhaContaPage } from './minha-conta.component';
import { AuthService } from '../../services/auth.service';
import { AgendaService } from '../../services/agenda.service';
import { UsuariosService } from '../../services/usuarios.service';
import { ToastService } from '../../services/toast.service';

describe('MinhaContaPage', () => {
  let fixture: ComponentFixture<MinhaContaPage>;
  let component: MinhaContaPage;

  const authServiceSpy = {
    obterSessaoAutenticada: vi.fn().mockReturnValue({
      id: 1,
      nome: 'Dra. Beatriz',
      email: 'beatriz@test.com',
      tipo_usuario: 'dentista',
    }),
  };
  const agendaServiceSpy = {
    listarConsultas: vi.fn().mockReturnValue(of([])),
  };
  const usuariosServiceSpy = {
    editarMinhaConta: vi.fn().mockReturnValue(of({ mensagem: 'Conta atualizada' })),
  };
  const toastServiceSpy = {
    sucesso: vi.fn(),
    erro: vi.fn(),
    info: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhaContaPage],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AgendaService, useValue: agendaServiceSpy },
        { provide: UsuariosService, useValue: usuariosServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhaContaPage);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('carrega dados do usuario no ngOnInit', () => {
    component.ngOnInit();
    expect(component.nomeUsuario).toBe('Dra. Beatriz');
    expect(component.tipoUsuarioSlug).toBe('dentista');
  });

  it('alterna secao de senha', () => {
    expect(component.mostraSecaoSenha).toBe(false);
    component.alternarSecaoSenha();
    expect(component.mostraSecaoSenha).toBe(true);
  });
});
