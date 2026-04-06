import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { QueryCacheService } from './query-cache.service';

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

  listarTratamentos(forcarAtualizacao = false): Observable<ListarTratamentosResponse> {
    return this.queryCache.getOrSet(
      this.cacheKeyListagem,
      () =>
        this.http
          .get<ListarTratamentosResponse>(this.apiUrl, { withCredentials: true })
          .pipe(
            catchError((error) =>
              throwError(
                () =>
                  new Error(
                    extrairMensagemErroApi(
                      error?.error,
                      'Nao foi possivel processar os tratamentos.',
                    ),
                  ),
              ),
            ),
          ),
      undefined,
      forcarAtualizacao,
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
        tap((resposta) => {
          this.queryCache.updateSnapshot<ListarTratamentosResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const tratamentosAtuais = atual?.tratamentos ?? [];
              return {
                total: (atual?.total ?? tratamentosAtuais.length) + 1,
                tratamentos: [resposta.tratamento, ...tratamentosAtuais],
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os tratamentos.'),
              ),
          ),
        ),
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
        tap((resposta) => {
          this.queryCache.updateSnapshot<ListarTratamentosResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const tratamentosAtuais = atual?.tratamentos ?? [];
              return {
                total: atual?.total ?? tratamentosAtuais.length,
                tratamentos: tratamentosAtuais.map((item) =>
                  item.id === resposta.tratamento.id ? resposta.tratamento : item,
                ),
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os tratamentos.'),
              ),
          ),
        ),
      );
  }

  excluirTratamento(tratamentoId: string): Observable<ExcluirTratamentoResponse> {
    return this.http
      .delete<ExcluirTratamentoResponse>(`${this.apiUrl}?id=${encodeURIComponent(tratamentoId)}`, {
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.queryCache.updateSnapshot<ListarTratamentosResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const tratamentosAtuais = atual?.tratamentos ?? [];
              const tratamentos = tratamentosAtuais.filter((item) => item.id !== tratamentoId);
              return {
                total: tratamentos.length,
                tratamentos,
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os tratamentos.'),
              ),
          ),
        ),
      );
  }
}
