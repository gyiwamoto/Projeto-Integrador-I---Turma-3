import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  ProcedimentoRealizadoItem,
  SalvarProcedimentoRealizadoPayload,
} from '../interfaces/ProcedimentoRealizado';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { QueryCacheService } from './query-cache.service';

interface ProcedimentoRealizadoApiItem {
  id: string;
  consulta_id: string;
  tratamento_id: string;
  tratamento_nome: string | null;
  dente: number | null;
  face: string | null;
  data_procedimento: string;
  observacoes: string | null;
  criado_em: string;
}

export interface ListarProcedimentosRealizadosResponse {
  total: number;
  procedimentos_realizados: ProcedimentoRealizadoApiItem[];
}

interface SalvarProcedimentoRealizadoResponse {
  mensagem: string;
  procedimento: ProcedimentoRealizadoApiItem;
}

export interface AtualizarProcedimentoRealizadoPayload {
  tratamentoId: string;
  dente: number;
  face: string;
  dataProcedimento: string;
  observacoes: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProcedimentosRealizadosService {
  private readonly apiUrl = '/api/procedimentos-realizados';
  private readonly cacheKeyListagem = `${this.apiUrl}:list`;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: QueryCacheService,
  ) {}

  listarProcedimentosRealizados(
    forcarAtualizacao = false,
  ): Observable<ListarProcedimentosRealizadosResponse> {
    return this.queryCache.getOrSet(
      this.cacheKeyListagem,
      () =>
        this.http
          .get<ListarProcedimentosRealizadosResponse>(this.apiUrl, { withCredentials: true })
          .pipe(
            catchError((error) =>
              throwError(
                () =>
                  new Error(
                    extrairMensagemErroApi(
                      error?.error,
                      'Nao foi possivel carregar os procedimentos realizados.',
                    ),
                  ),
              ),
            ),
          ),
      undefined,
      forcarAtualizacao,
    );
  }

  listarPorConsulta(consultaId: string): Observable<ProcedimentoRealizadoItem[]> {
    const cacheKey = `${this.apiUrl}:consulta:${consultaId}`;

    return this.queryCache.getOrSet(cacheKey, () =>
      this.http
        .get<ListarProcedimentosRealizadosResponse>(
          `${this.apiUrl}?consulta_id=${encodeURIComponent(consultaId)}`,
          { withCredentials: true },
        )
        .pipe(
          map((resposta) =>
            (resposta.procedimentos_realizados ?? []).map((item) => this.mapearProcedimento(item)),
          ),
          catchError((error) =>
            throwError(
              () =>
                new Error(
                  extrairMensagemErroApi(
                    error?.error,
                    'Nao foi possivel carregar os procedimentos realizados.',
                  ),
                ),
            ),
          ),
        ),
    );
  }

  criarProcedimento(
    payload: SalvarProcedimentoRealizadoPayload,
  ): Observable<ProcedimentoRealizadoItem> {
    return this.http
      .post<SalvarProcedimentoRealizadoResponse>(
        this.apiUrl,
        {
          consulta_id: payload.consultaId,
          tratamento_id: payload.tratamentoId,
          dente: payload.dente,
          face: payload.face,
          data_procedimento: payload.dataProcedimento,
          observacoes: payload.observacoes || null,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidateByPrefix(this.apiUrl)),
        map((resposta) => this.mapearProcedimento(resposta.procedimento)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel registrar o procedimento.'),
              ),
          ),
        ),
      );
  }

  excluirProcedimento(procedimentoId: string): Observable<{ mensagem: string }> {
    return this.http
      .delete<{
        mensagem: string;
      }>(`${this.apiUrl}?id=${encodeURIComponent(procedimentoId)}`, { withCredentials: true })
      .pipe(
        tap(() => this.queryCache.invalidateByPrefix(this.apiUrl)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel excluir o procedimento.'),
              ),
          ),
        ),
      );
  }

  atualizarProcedimento(
    procedimentoId: string,
    payload: AtualizarProcedimentoRealizadoPayload,
  ): Observable<ProcedimentoRealizadoItem> {
    return this.http
      .put<SalvarProcedimentoRealizadoResponse>(
        `${this.apiUrl}?id=${encodeURIComponent(procedimentoId)}`,
        {
          tratamento_id: payload.tratamentoId,
          dente: payload.dente,
          face: payload.face,
          data_procedimento: payload.dataProcedimento,
          observacoes: payload.observacoes || null,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidateByPrefix(this.apiUrl)),
        map((resposta) => this.mapearProcedimento(resposta.procedimento)),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel atualizar o procedimento.'),
              ),
          ),
        ),
      );
  }

  private mapearProcedimento(item: ProcedimentoRealizadoApiItem): ProcedimentoRealizadoItem {
    return {
      id: item.id,
      consultaId: item.consulta_id,
      tratamentoId: item.tratamento_id,
      tratamentoNome: item.tratamento_nome ?? 'Tratamento',
      dente: item.dente,
      face: item.face,
      dataProcedimento: item.data_procedimento,
      observacoes: item.observacoes ?? '',
      criadoEm: item.criado_em,
    };
  }
}
