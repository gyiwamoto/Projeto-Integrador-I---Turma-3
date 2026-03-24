import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  LoginResponse,
  SessaoAutenticadaResponse,
  UsuarioAutenticado,
} from '../../interfaces/Usuario';

interface ErroApiResponse {
  erro?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly apiUrl = '/api/auth';
  private sessaoAtiva = false;
  private usuarioAtual: UsuarioAutenticado | null = null;

  constructor(private readonly http: HttpClient) {}

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(this.apiUrl, { email, senha }, { withCredentials: true })
      .pipe(
        tap((response) => {
          this.sessaoAtiva = true;
          this.usuarioAtual = response.usuario;
        }),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  validarSessao(): Observable<boolean> {
    return this.http.get<SessaoAutenticadaResponse>(this.apiUrl, { withCredentials: true }).pipe(
      map((response) => {
        this.sessaoAtiva = true;
        this.usuarioAtual = response.usuario;
        return true;
      }),
      catchError(() => {
        this.sessaoAtiva = false;
        this.usuarioAtual = null;
        return of(false);
      }),
    );
  }

  logout(): Observable<{ mensagem: string }> {
    return this.http.delete<{ mensagem: string }>(this.apiUrl, { withCredentials: true }).pipe(
      tap(() => this.removerToken()),
      catchError((error) => {
        this.removerToken();
        return throwError(() => new Error(this.extrairMensagemErro(error?.error)));
      }),
    );
  }

  possuiToken(): boolean {
    return this.sessaoAtiva;
  }

  obterUsuarioAtual(): UsuarioAutenticado | null {
    return this.usuarioAtual;
  }

  removerToken(): void {
    this.sessaoAtiva = false;
    this.usuarioAtual = null;
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar a autenticacao. Tente novamente.';
  }
}
