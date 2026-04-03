import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../services/auth.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  const authServiceSpy = {
    obterSessaoAutenticada: vi.fn(),
  };

  beforeEach(async () => {
    authServiceSpy.obterSessaoAutenticada.mockReturnValue({ nome: 'Equipe' });

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('retorna nome do usuario autenticado', () => {
    authServiceSpy.obterSessaoAutenticada.mockReturnValue({ nome: 'Ana' });
    expect(component.nomeUsuario).toBe('Ana');
  });

  it('troca visibilidade do faturamento', () => {
    expect(component.ocultarFaturamento).toBe(false);
    component.alternarOcultacaoFaturamento();
    expect(component.ocultarFaturamento).toBe(true);
  });
});
