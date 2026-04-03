import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginResponse } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const storageKey = 'dentistaOrganizado.auth';

  const respostaLoginMock: LoginResponse = {
    expira_em: '8h',
    usuario: {
      id: 1,
      nome: 'Admin',
      email: 'admin@dentistaOrganizado.com',
      tipo_usuario: 'admin',
    },
  };

  beforeEach(() => {
    window.sessionStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    window.sessionStorage.clear();
  });

  it('realiza login e armazena dados do usuario', () => {
    let resultado: LoginResponse | undefined;
    service.login('admin@dentistaOrganizado.com', '123456').subscribe((resposta) => {
      resultado = resposta;
    });

    const req = httpMock.expectOne('/api/auth');
    expect(req.request.method).toBe('POST');
    req.flush(respostaLoginMock);

    expect(resultado).toEqual(respostaLoginMock);
  });

  it('envia do usuario com credenciais corretamente', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();

    const req = httpMock.expectOne('/api/auth');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@dentistaOrganizado.com', senha: '123456' });
    expect(req.request.withCredentials).toBe(true);
    req.flush(respostaLoginMock);
  });

  it('armazena sessao ao fazer login', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();

    const req = httpMock.expectOne('/api/auth');
    expect(service.possuiToken()).toBe(false);
    req.flush(respostaLoginMock);
    expect(service.possuiToken()).toBe(true);
    expect(window.sessionStorage.getItem(storageKey)).toContain('admin@dentistaOrganizado.com');
  });

  it('lanca erro quando credenciais sao invalidas', () => {
    let erro: Error | undefined;
    service.login('admin@dentistaOrganizado.com', 'errada').subscribe({
      error: (e: Error) => {
        erro = e;
      },
    });

    const req = httpMock.expectOne('/api/auth');
    req.flush({ erro: 'Credenciais invalidas.' }, { status: 401, statusText: 'Unauthorized' });

    expect(erro?.message).toBe('Credenciais invalidas.');
  });

  it('valida sessao do usuario', () => {
    let autenticado: boolean | undefined;
    service.validarSessao(true).subscribe((resultado) => {
      autenticado = resultado;
    });

    const req = httpMock.expectOne('/api/auth');
    expect(req.request.method).toBe('GET');
    req.flush({ usuario: respostaLoginMock.usuario, expira_em: '8h' });

    expect(autenticado).toBe(true);
  });

  it('retorna false quando sessao eh invalida', () => {
    let autenticado: boolean | undefined;
    service.validarSessao(true).subscribe((resultado) => {
      autenticado = resultado;
    });

    const req = httpMock.expectOne('/api/auth');
    req.flush({ erro: 'Token invalido' }, { status: 401, statusText: 'Unauthorized' });

    expect(autenticado).toBe(false);
  });

  it('retorna false localmente quando nao ha sessao no cache', () => {
    let autenticado: boolean | undefined;

    service.validarSessao().subscribe((resultado) => {
      autenticado = resultado;
    });

    httpMock.expectNone('/api/auth');
    expect(autenticado).toBe(false);
  });

  it('realiza logout', () => {
    let resultado: { mensagem: string } | undefined;
    service.logout().subscribe((resposta) => {
      resultado = resposta;
    });

    const req = httpMock.expectOne('/api/auth');
    expect(req.request.method).toBe('DELETE');
    req.flush({ mensagem: 'Logout realizado com sucesso.' });

    expect(resultado?.mensagem).toContain('sucesso');
  });

  it('remove sessao ao fazer logout', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();
    const reqLogin = httpMock.expectOne('/api/auth');
    reqLogin.flush(respostaLoginMock);

    expect(service.possuiToken()).toBe(true);

    service.logout().subscribe();
    const reqLogout = httpMock.expectOne('/api/auth');
    reqLogout.flush({ mensagem: 'Logout realizado com sucesso.' });

    expect(service.possuiToken()).toBe(false);
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
  });

  it('obtem usuario autenticado', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();

    const req = httpMock.expectOne('/api/auth');
    req.flush(respostaLoginMock);

    const usuario = service.obterSessaoAutenticada();
    expect(usuario?.nome).toBe('Admin');
    expect(usuario?.email).toBe('admin@dentistaOrganizado.com');
  });

  it('verifica se usuario eh admin', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();

    const req = httpMock.expectOne('/api/auth');
    req.flush(respostaLoginMock);

    expect(service.ehAdmin()).toBe(true);
  });

  it('verifica se usuario nao eh admin', () => {
    const respostaRecepcionista = {
      ...respostaLoginMock,
      usuario: { ...respostaLoginMock.usuario, tipo_usuario: 'recepcionista' as const },
    };

    service.login('recepcionista@dentistaOrganizado.com', '123456').subscribe();

    const req = httpMock.expectOne('/api/auth');
    req.flush(respostaRecepcionista);

    expect(service.ehAdmin()).toBe(false);
  });

  it('remove token ao chamar removerToken', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();

    const req = httpMock.expectOne('/api/auth');
    req.flush(respostaLoginMock);

    expect(service.possuiToken()).toBe(true);

    service.removerToken();

    expect(service.possuiToken()).toBe(false);
    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
  });

  it('retorna null ao obter usuario apos remover token', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();

    const req = httpMock.expectOne('/api/auth');
    req.flush(respostaLoginMock);

    service.removerToken();

    const usuario = service.obterSessaoAutenticada();
    expect(usuario).toBeNull();
  });

  it('hidratra sessao do sessionStorage ao iniciar service', () => {
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        expiraEm,
        usuario: respostaLoginMock.usuario,
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    const serviceHidratado = TestBed.inject(AuthService);

    expect(serviceHidratado.possuiToken()).toBe(true);
    expect(serviceHidratado.obterSessaoAutenticada()?.email).toBe('admin@dentistaOrganizado.com');
  });

  it('nao chama GET quando sessao local ainda esta valida', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();
    const reqLogin = httpMock.expectOne('/api/auth');
    reqLogin.flush(respostaLoginMock);

    let autenticado: boolean | undefined;
    service.validarSessao().subscribe((resultado) => {
      autenticado = resultado;
    });

    httpMock.expectNone('/api/auth');
    expect(autenticado).toBe(true);
  });

  it('chama GET quando validarSessao forcado', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();
    const reqLogin = httpMock.expectOne('/api/auth');
    reqLogin.flush(respostaLoginMock);

    let autenticado: boolean | undefined;
    service.validarSessao(true).subscribe((resultado) => {
      autenticado = resultado;
    });

    const req = httpMock.expectOne('/api/auth');
    expect(req.request.method).toBe('GET');
    req.flush({ usuario: respostaLoginMock.usuario, expira_em: '8h' });

    expect(autenticado).toBe(true);
  });

  it('validarSessaoComCache usa cache quando sessao eh valida', () => {
    service.login('admin@dentistaOrganizado.com', '123456').subscribe();
    const reqLogin = httpMock.expectOne('/api/auth');
    reqLogin.flush(respostaLoginMock);

    let autenticado: boolean | undefined;
    service.validarSessaoComCache().subscribe((resultado) => {
      autenticado = resultado;
    });

    httpMock.expectNone('/api/auth');
    expect(autenticado).toBe(true);
  });

  it('validarSessaoComCache chama GET quando cache nao existe', () => {
    let autenticado: boolean | undefined;
    service.validarSessaoComCache().subscribe((resultado) => {
      autenticado = resultado;
    });

    const req = httpMock.expectOne('/api/auth');
    expect(req.request.method).toBe('GET');
    req.flush({ usuario: respostaLoginMock.usuario, expira_em: '8h' });

    expect(autenticado).toBe(true);
  });

  it('validarSessaoComCache chama GET quando sessao esta expirada', () => {
    const expiraEm = new Date(Date.now() - 1000).toISOString();
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        expiraEm,
        usuario: respostaLoginMock.usuario,
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    let autenticado: boolean | undefined;
    service.validarSessaoComCache().subscribe((resultado) => {
      autenticado = resultado;
    });

    const req = httpMock.expectOne('/api/auth');
    expect(req.request.method).toBe('GET');
    req.flush({ usuario: respostaLoginMock.usuario, expira_em: '8h' });

    expect(autenticado).toBe(true);
  });
});
