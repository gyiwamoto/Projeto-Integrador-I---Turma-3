import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { QueryCacheService } from './query-cache.service';

interface ErroApiResponse {
  erro?: string;
}

export interface TratamentoItem {
  id: string;
  nome: string;
  descricao: string | null;
  valor: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface ListarTratamentosResponse {
  total: number;
  tratamentos: TratamentoItem[];
}

export interface SalvarTratamentoPayload {
  nome: string;
  descricao: string;
  valor: number;
  ativo: boolean;
}

export interface SalvarTratamentoResponse {
  mensagem: string;
  tratamento: TratamentoItem;
}

export interface ExcluirTratamentoResponse {
  mensagem: string;
}

@Injectable({
  providedIn: 'root',
})
export class TratamentosService {
  private readonly apiUrl = '/api/tratamentos';
  private readonly cacheKeyListagem = `${this.apiUrl}:list`;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: QueryCacheService,
  ) {}

  listarTratamentos(): Observable<ListarTratamentosResponse> {
    return this.queryCache.getOrSet(this.cacheKeyListagem, () =>
      this.http
        .get<ListarTratamentosResponse>(this.apiUrl, { withCredentials: true })
        .pipe(
          catchError((error) =>
            throwError(() => new Error(this.extrairMensagemErro(error?.error))),
          ),
        ),
    );
  }

  criarTratamento(payload: SalvarTratamentoPayload): Observable<SalvarTratamentoResponse> {
    return this.http
      .post<SalvarTratamentoResponse>(
        this.apiUrl,
        {
          nome: payload.nome.trim(),
          descricao: payload.descricao.trim(),
          valor: payload.valor,
          ativo: payload.ativo,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  editarTratamento(
    tratamentoId: string,
    payload: SalvarTratamentoPayload,
  ): Observable<SalvarTratamentoResponse> {
    return this.http
      .put<SalvarTratamentoResponse>(
        `${this.apiUrl}?id=${encodeURIComponent(tratamentoId)}`,
        {
          nome: payload.nome.trim(),
          descricao: payload.descricao.trim(),
          valor: payload.valor,
          ativo: payload.ativo,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  excluirTratamento(tratamentoId: string): Observable<ExcluirTratamentoResponse> {
    return this.http
      .delete<ExcluirTratamentoResponse>(`${this.apiUrl}?id=${encodeURIComponent(tratamentoId)}`, {
        withCredentials: true,
      })
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar os tratamentos.';
  }
}
