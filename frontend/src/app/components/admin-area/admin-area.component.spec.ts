import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AdminAreaComponent } from './admin-area.component';

describe('AdminAreaComponent', () => {
  let fixture: ComponentFixture<AdminAreaComponent>;
  let component: AdminAreaComponent;
  let AuthServiceSpy: {
    possuiToken: ReturnType<typeof vi.fn>;
    validarSessao: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    removerToken: ReturnType<typeof vi.fn>;
    obterSessaoAutenticada: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    AuthServiceSpy = {
      possuiToken: vi.fn().mockReturnValue(false),
      validarSessao: vi.fn(),
      logout: vi.fn(),
      removerToken: vi.fn(),
      obterSessaoAutenticada: vi.fn(),
    };
    AuthServiceSpy.validarSessao.mockReturnValue(of(false));
    AuthServiceSpy.obterSessaoAutenticada.mockReturnValue(null);
    routerSpy = {
      navigateByUrl: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminAreaComponent],
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAreaComponent);
    component = fixture.componentInstance;
  });

  it('mostra botao de login quando nao ha sessao', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(false));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(botao.textContent?.trim()).toBe('Login');
  });

  it('navega para login ao clicar no botao de login', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(false));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    botao.click();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('executa logout e redireciona para vitrine quando ha sessao', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(true));
    AuthServiceSpy.possuiToken.mockReturnValue(true);
    AuthServiceSpy.obterSessaoAutenticada.mockReturnValue({
      id: 1,
      nome: 'Administrador',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });
    AuthServiceSpy.logout.mockReturnValue(of({ mensagem: 'Logout realizado com sucesso.' }));
    component.sessaoAtiva = true;
    component.usuarioLogado = {
      nome: 'Administrador',
      tipo_usuario: 'admin',
    };

    fixture.detectChanges();

    const botoes = fixture.nativeElement.querySelectorAll('button');
    const botao = botoes[1] as HTMLButtonElement;
    botao.click();

    expect(AuthServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('exibe identificacao de admin quando ha sessao', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(true));
    AuthServiceSpy.possuiToken.mockReturnValue(true);
    AuthServiceSpy.obterSessaoAutenticada.mockReturnValue({
      id: 1,
      nome: 'Xyz',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    fixture = TestBed.createComponent(AdminAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const botoes = fixture.nativeElement.querySelectorAll('button');
    const identificacao = botoes[0] as HTMLButtonElement;
    expect(identificacao.textContent?.trim()).toBe('Admin Xyz');
  });

  it('exibe identificacao de recepcionista quando ha sessao', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(true));
    AuthServiceSpy.possuiToken.mockReturnValue(true);
    AuthServiceSpy.obterSessaoAutenticada.mockReturnValue({
      id: 2,
      nome: 'Xyz',
      email: 'recepcionista@teste.com',
      tipo_usuario: 'recepcionista',
    });

    fixture = TestBed.createComponent(AdminAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const botoes = fixture.nativeElement.querySelectorAll('button');
    const identificacao = botoes[0] as HTMLButtonElement;
    expect(identificacao.textContent?.trim()).toBe('Recepcionista Xyz');
  });

  it('navega para dashboard ao clicar no usuario autenticado', () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(true));
    AuthServiceSpy.possuiToken.mockReturnValue(true);
    AuthServiceSpy.obterSessaoAutenticada.mockReturnValue({
      id: 1,
      nome: 'Xyz',
      email: 'admin@teste.com',
      tipo_usuario: 'admin',
    });

    fixture = TestBed.createComponent(AdminAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const botoes = fixture.nativeElement.querySelectorAll('button');
    const identificacao = botoes[0] as HTMLButtonElement;
    identificacao.click();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });
});
