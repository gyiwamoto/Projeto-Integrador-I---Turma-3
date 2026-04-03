import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;
  const authServiceSpy = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    authServiceSpy.login.mockReturnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('cria componente', () => {
    expect(component).toBeDefined();
  });

  it('alterna exibicao de senha', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
  });

  it('faz submit valido e navega para dashboard', () => {
    component.form.setValue({ email: 'user@test.com', senha: '123456' });
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('user@test.com', '123456');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard'], { replaceUrl: true });
  });
});
