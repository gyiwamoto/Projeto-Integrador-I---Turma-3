import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GuardResult, MaybeAsync, Router, UrlTree } from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { adminGuard, authGuard, loginGuard } from './auth.guard';

async function resolverResultadoGuard(resultado: MaybeAsync<GuardResult>): Promise<GuardResult> {
  if (isObservable(resultado)) {
    return await firstValueFrom(resultado);
  }

  return await Promise.resolve(resultado);
}

describe('authGuard', () => {
  let AuthServiceSpy: {
    validarSessaoComCache: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    AuthServiceSpy = {
      validarSessaoComCache: vi.fn(),
    };
    routerSpy = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    });
  });

  it('permite acesso quando ha sessao ativa', async () => {
    AuthServiceSpy.validarSessaoComCache.mockReturnValue(of(true));

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redireciona para login quando nao ha sessao', async () => {
    const arvoreLogin = {} as UrlTree;
    AuthServiceSpy.validarSessaoComCache.mockReturnValue(of(false));
    routerSpy.createUrlTree.mockReturnValue(arvoreLogin);

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(arvoreLogin);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('redireciona para login quando validarSessaoComCache falha', async () => {
    const arvoreLogin = {} as UrlTree;
    AuthServiceSpy.validarSessaoComCache.mockReturnValue(throwError(() => new Error('falha')));
    routerSpy.createUrlTree.mockReturnValue(arvoreLogin);

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => authGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(arvoreLogin);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});

describe('loginGuard', () => {
  let AuthServiceSpy: {
    validarSessao: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    AuthServiceSpy = {
      validarSessao: vi.fn(),
    };
    routerSpy = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    });
  });

  it('permite acesso para visitante sem sessao', async () => {
    AuthServiceSpy.validarSessao.mockReturnValue(of(false));

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => loginGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redireciona para dashboard quando ja autenticado', async () => {
    const arvoreDashboard = {} as UrlTree;
    AuthServiceSpy.validarSessao.mockReturnValue(of(true));
    routerSpy.createUrlTree.mockReturnValue(arvoreDashboard);

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => loginGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(arvoreDashboard);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });

  it('permite acesso quando validarSessao falha', async () => {
    AuthServiceSpy.validarSessao.mockReturnValue(throwError(() => new Error('falha')));

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => loginGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(true);
  });
});

describe('adminGuard', () => {
  let AuthServiceSpy: {
    validarSessaoComCache: ReturnType<typeof vi.fn>;
    ehAdmin: ReturnType<typeof vi.fn>;
  };
  let routerSpy: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    AuthServiceSpy = {
      validarSessaoComCache: vi.fn(),
      ehAdmin: vi.fn(),
    };
    routerSpy = {
      createUrlTree: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: AuthServiceSpy as unknown as AuthService },
        { provide: Router, useValue: routerSpy as unknown as Router },
      ],
    });
  });

  it('permite acesso quando usuario eh admin', async () => {
    AuthServiceSpy.validarSessaoComCache.mockReturnValue(of(true));
    AuthServiceSpy.ehAdmin.mockReturnValue(true);

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(true);
    expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
  });

  it('redireciona para dashboard quando usuario nao eh admin', async () => {
    const arvoreDashboard = {} as UrlTree;
    AuthServiceSpy.validarSessaoComCache.mockReturnValue(of(true));
    AuthServiceSpy.ehAdmin.mockReturnValue(false);
    routerSpy.createUrlTree.mockReturnValue(arvoreDashboard);

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(arvoreDashboard);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });

  it('redireciona para dashboard quando nao autenticado', async () => {
    const arvoreDashboard = {} as UrlTree;
    AuthServiceSpy.validarSessaoComCache.mockReturnValue(of(false));
    routerSpy.createUrlTree.mockReturnValue(arvoreDashboard);

    const resultado = await resolverResultadoGuard(
      TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any)),
    );

    expect(resultado).toBe(arvoreDashboard);
    expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
