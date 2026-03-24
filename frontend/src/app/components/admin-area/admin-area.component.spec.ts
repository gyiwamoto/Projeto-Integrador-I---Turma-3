import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../services/auth-api.service';
import { AdminAreaComponent } from './admin-area.component';

describe('AdminAreaComponent', () => {
  let fixture: ComponentFixture<AdminAreaComponent>;
  let component: AdminAreaComponent;
  let authApiServiceSpy: {
    validarSessao: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    removerToken: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authApiServiceSpy = {
      validarSessao: vi.fn(),
      logout: vi.fn(),
      removerToken: vi.fn(),
    };
    routerSpy = {
      navigateByUrl: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminAreaComponent],
      providers: [
        { provide: AuthApiService, useValue: authApiServiceSpy as unknown as AuthApiService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAreaComponent);
    component = fixture.componentInstance;
  });

  it('mostra botao de login quando nao ha sessao', () => {
    authApiServiceSpy.validarSessao.mockReturnValue(of(false));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(botao.textContent?.trim()).toBe('Login');
  });

  it('navega para login ao clicar no botao de login', () => {
    authApiServiceSpy.validarSessao.mockReturnValue(of(false));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    botao.click();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('executa logout e redireciona para home quando ha sessao', () => {
    authApiServiceSpy.validarSessao.mockReturnValue(of(true));
    authApiServiceSpy.logout.mockReturnValue(of({ mensagem: 'Logout realizado com sucesso.' }));

    fixture.detectChanges();

    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    botao.click();

    expect(authApiServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/');
  });
});
