import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConvenioItem, SalvarConvenioPayload } from '../interfaces/Convenio';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { QueryCacheService } from './query-cache.service';

export interface ListarConveniosResponse {
  total: number;
  convenios: ConvenioItem[];
}

export interface SalvarConvenioResponse {
  mensagem: string;
  convenio: ConvenioItem;
}

export interface ExcluirConvenioResponse {
  mensagem: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConveniosService {
  private readonly apiUrl = '/api/convenios';
  private readonly cacheKeyListagem = `${this.apiUrl}:list`;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: QueryCacheService,
  ) {}

  listarConvenios(): Observable<ListarConveniosResponse> {
    return this.queryCache.getOrSet(this.cacheKeyListagem, () =>
      this.http
        .get<ListarConveniosResponse>(this.apiUrl, { withCredentials: true })
        .pipe(
          catchError((error) =>
            throwError(
              () =>
                new Error(
                  extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os convenios.'),
                ),
            ),
          ),
        ),
    );
  }

  criarConvenio(payload: SalvarConvenioPayload): Observable<SalvarConvenioResponse> {
    return this.http
      .post<SalvarConvenioResponse>(
        this.apiUrl,
        {
          nome: payload.nome.trim(),
          cnpj: payload.cnpj?.trim() || null,
          ativo: payload.ativo,
        },
        { withCredentials: true },
      )
      .pipe(
        tap((resposta) => {
          this.queryCache.updateSnapshot<ListarConveniosResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const conveniosAtuais = atual?.convenios ?? [];
              return {
                total: (atual?.total ?? conveniosAtuais.length) + 1,
                convenios: [resposta.convenio, ...conveniosAtuais],
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os convenios.'),
              ),
          ),
        ),
      );
  }

  editarConvenio(
    convenioId: string,
    payload: SalvarConvenioPayload,
  ): Observable<SalvarConvenioResponse> {
    return this.http
      .put<SalvarConvenioResponse>(
        `${this.apiUrl}?id=${encodeURIComponent(convenioId)}`,
        {
          nome: payload.nome.trim(),
          cnpj: payload.cnpj?.trim() || null,
          ativo: payload.ativo,
        },
        { withCredentials: true },
      )
      .pipe(
        tap((resposta) => {
          this.queryCache.updateSnapshot<ListarConveniosResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const conveniosAtuais = atual?.convenios ?? [];
              return {
                total: atual?.total ?? conveniosAtuais.length,
                convenios: conveniosAtuais.map((item) =>
                  item.id === resposta.convenio.id ? resposta.convenio : item,
                ),
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os convenios.'),
              ),
          ),
        ),
      );
  }

  excluirConvenio(convenioId: string): Observable<ExcluirConvenioResponse> {
    return this.http
      .delete<ExcluirConvenioResponse>(`${this.apiUrl}?id=${encodeURIComponent(convenioId)}`, {
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.queryCache.updateSnapshot<ListarConveniosResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const conveniosAtuais = atual?.convenios ?? [];
              const convenios = conveniosAtuais.filter((item) => item.id !== convenioId);
              return {
                total: convenios.length,
                convenios,
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os convenios.'),
              ),
          ),
        ),
      );
  }
}
