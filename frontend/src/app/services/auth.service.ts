import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { CacheStoreService } from './cache-store.service';

interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: 'admin' | 'dentista' | 'recepcionista';
}

export interface LoginResponse {
  expira_em: string;
  usuario: UsuarioAutenticado;
}

interface SessaoPersistida {
  expiraEm: string;
  usuario: UsuarioAutenticado;
}

interface SessaoApiResponse {
  expira_em?: string;
  usuario: UsuarioAutenticado;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly chaveSessaoStorage = 'dentistaOrganizado.auth';
  private sessaoAtiva = false;
  private usuarioAutenticado: UsuarioAutenticado | null = null;
  private expiraEm: Date | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: CacheStoreService,
  ) {
    this.hidratarSessaoDoStorage();
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.apiUrl, { email, senha }, { withCredentials: true })
      .pipe(
        tap((resposta) => {
          this.definirSessaoAtiva(resposta.usuario, this.calcularExpiracao(resposta.expira_em));
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(
                  error?.error,
                  'Nao foi possivel processar a autenticacao. Tente novamente.',
                ),
              ),
          ),
        ),
      );
  }

  validarSessao(forcarApi = false): Observable<boolean> {
    if (!forcarApi) {
      return of(this.temSessaoValidaLocalmente());
    }

    return this.http.get<SessaoApiResponse>(this.apiUrl, { withCredentials: true }).pipe(
      map((resposta) => {
        this.definirSessaoAtiva(
          resposta.usuario,
          resposta.expira_em
            ? this.calcularExpiracao(resposta.expira_em)
            : this.calcularExpiracao('8h'),
        );
        return true;
      }),
      catchError(() => {
        this.removerToken();
        return of(false);
      }),
    );
  }

  validarSessaoComCache(): Observable<boolean> {
    if (this.temSessaoValidaLocalmente()) {
      return of(true);
    }

    return this.validarSessao(true);
  }

  logout(): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(this.apiUrl, { withCredentials: true }).pipe(
      tap(() => this.removerToken()),
      catchError((error) => {
        this.removerToken();
        return throwError(
          () =>
            new Error(
              extrairMensagemErroApi(
                error?.error,
                'Nao foi possivel processar a autenticacao. Tente novamente.',
              ),
            ),
        );
      }),
    );
  }

  possuiToken(): boolean {
    return this.sessaoAtiva;
  }

  obterSessaoAutenticada(): UsuarioAutenticado | null {
    return this.usuarioAutenticado;
  }

  obterUsuarioAtual(): UsuarioAutenticado | null {
    return this.obterSessaoAutenticada();
  }

  ehAdmin(): boolean {
    return this.usuarioAutenticado?.tipo_usuario === 'admin';
  }

  removerToken(): void {
    this.sessaoAtiva = false;
    this.usuarioAutenticado = null;
    this.expiraEm = null;
    this.queryCache.clear();
    this.limparSessaoPersistida();
  }

  private definirSessaoAtiva(usuario: UsuarioAutenticado, expiraEm: Date): void {
    this.queryCache.clear();
    this.sessaoAtiva = true;
    this.usuarioAutenticado = usuario;
    this.expiraEm = expiraEm;
    this.persistirSessao({
      usuario,
      expiraEm: expiraEm.toISOString(),
    });
  }

  private temSessaoValidaLocalmente(): boolean {
    if (!this.sessaoAtiva || !this.usuarioAutenticado || !this.expiraEm) {
      return false;
    }

    if (this.expiraEm.getTime() <= Date.now()) {
      this.removerToken();
      return false;
    }

    return true;
  }

  private calcularExpiracao(valorExpiracao: string): Date {
    const agora = Date.now();
    const normalizado = valorExpiracao.trim().toLowerCase();
    const match = normalizado.match(/^(\d+)\s*([smhd])$/);

    if (!match) {
      return new Date(agora + 8 * 60 * 60 * 1000);
    }

    const quantidade = Number(match[1]);
    const unidade = match[2] ?? 'h';
    const multiplicadorPorUnidade: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const multiplicador = multiplicadorPorUnidade[unidade] ?? 8 * 60 * 60 * 1000;
    return new Date(agora + quantidade * multiplicador);
  }

  private hidratarSessaoDoStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const bruto = window.sessionStorage.getItem(this.chaveSessaoStorage);
    if (!bruto) {
      return;
    }

    try {
      const sessao = JSON.parse(bruto) as SessaoPersistida;
      const expiraEm = new Date(sessao.expiraEm);

      if (!sessao.usuario || Number.isNaN(expiraEm.getTime()) || expiraEm.getTime() <= Date.now()) {
        this.removerToken();
        return;
      }

      this.sessaoAtiva = true;
      this.usuarioAutenticado = sessao.usuario;
      this.expiraEm = expiraEm;
    } catch {
      this.removerToken();
    }
  }

  private persistirSessao(sessao: SessaoPersistida): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.setItem(this.chaveSessaoStorage, JSON.stringify(sessao));
  }

  private limparSessaoPersistida(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.sessionStorage.removeItem(this.chaveSessaoStorage);
  }
}
