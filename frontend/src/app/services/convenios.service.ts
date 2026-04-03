import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConvenioItem, SalvarConvenioPayload } from '../interfaces/Convenio';
import { QueryCacheService } from './query-cache.service';

interface ErroApiResponse {
  erro?: string;
}

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
            throwError(() => new Error(this.extrairMensagemErro(error?.error))),
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
          ativo: payload.ativo,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
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
          ativo: payload.ativo,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  excluirConvenio(convenioId: string): Observable<ExcluirConvenioResponse> {
    return this.http
      .delete<ExcluirConvenioResponse>(`${this.apiUrl}?id=${encodeURIComponent(convenioId)}`, {
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

    return 'Nao foi possivel processar os convenios.';
  }
}
