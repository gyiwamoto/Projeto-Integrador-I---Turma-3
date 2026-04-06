import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import {
  CriarUsuarioPayload,
  EditarUsuarioPayload,
  EditarMinhaContaPayload,
  TipoUsuario,
  UsuarioListaItem,
} from '../interfaces/Usuario';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { QueryCacheService } from './query-cache.service';

export interface ListarUsuariosResponse {
  total: number;
  usuarios: UsuarioListaItem[];
}

export interface CriarUsuarioResponse {
  mensagem: string;
  usuario: UsuarioListaItem;
}

export interface ExcluirUsuarioResponse {
  mensagem: string;
}

export interface UsuarioAtualizadoResponse {
  mensagem: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    tipo_usuario: TipoUsuario;
    criado_em: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  private readonly apiUrl = '/api/usuarios';
  private readonly cacheKeyListagem = `${this.apiUrl}:list`;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: QueryCacheService,
  ) {}

  listarUsuarios(forcarAtualizacao = false): Observable<ListarUsuariosResponse> {
    return this.queryCache.getOrSet(
      this.cacheKeyListagem,
      () =>
        this.http
          .get<ListarUsuariosResponse>(this.apiUrl, { withCredentials: true })
          .pipe(
            catchError((error) =>
              throwError(
                () =>
                  new Error(
                    extrairMensagemErroApi(
                      error?.error,
                      'Nao foi possivel atualizar a senha. Tente novamente.',
                    ),
                  ),
              ),
            ),
          ),
      undefined,
      forcarAtualizacao,
    );
  }

  obterUsuariosEmCache(): UsuarioListaItem[] {
    return (
      this.queryCache.getSnapshot<ListarUsuariosResponse>(this.cacheKeyListagem)?.usuarios ?? []
    );
  }

  criarUsuario(payload: CriarUsuarioPayload): Observable<CriarUsuarioResponse> {
    return this.http
      .post<CriarUsuarioResponse>(
        this.apiUrl,
        {
          nome: payload.nome.trim(),
          email: payload.email.trim(),
          senha: payload.senha,
          tipo_usuario: payload.tipo_usuario,
        },
        { withCredentials: true },
      )
      .pipe(
        tap((resposta) => {
          this.queryCache.updateSnapshot<ListarUsuariosResponse>(this.cacheKeyListagem, (atual) => {
            const usuariosAtuais = atual?.usuarios ?? [];
            return {
              total: (atual?.total ?? usuariosAtuais.length) + 1,
              usuarios: [resposta.usuario, ...usuariosAtuais],
            };
          });
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(
                  error?.error,
                  'Nao foi possivel atualizar a senha. Tente novamente.',
                ),
              ),
          ),
        ),
      );
  }

  editarUsuario(
    usuarioId: string,
    payload: EditarUsuarioPayload,
  ): Observable<UsuarioAtualizadoResponse> {
    const body: Record<string, string> = {};

    if (payload.nome !== undefined) {
      body['nome'] = payload.nome.trim();
    }

    if (payload.email !== undefined) {
      body['email'] = payload.email.trim();
    }

    if (payload.senha !== undefined) {
      body['senha'] = payload.senha;
    }

    if (payload.tipo_usuario !== undefined) {
      body['tipo_usuario'] = payload.tipo_usuario;
    }

    return this.http
      .put<UsuarioAtualizadoResponse>(
        `${this.apiUrl}?id=${encodeURIComponent(String(usuarioId))}`,
        body,
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap((resposta) => {
          this.queryCache.updateSnapshot<ListarUsuariosResponse>(this.cacheKeyListagem, (atual) => {
            const usuariosAtuais = atual?.usuarios ?? [];
            const usuarioAtualizado: UsuarioListaItem = {
              ...resposta.usuario,
              id: resposta.usuario.id,
            };
            return {
              total: atual?.total ?? usuariosAtuais.length,
              usuarios: usuariosAtuais.map((item) =>
                String(item.id) === String(usuarioId) ? usuarioAtualizado : item,
              ),
            };
          });
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(
                  error?.error,
                  'Nao foi possivel atualizar a senha. Tente novamente.',
                ),
              ),
          ),
        ),
      );
  }

  excluirUsuario(usuarioId: string): Observable<ExcluirUsuarioResponse> {
    return this.http
      .delete<ExcluirUsuarioResponse>(
        `${this.apiUrl}?id=${encodeURIComponent(String(usuarioId))}`,
        {
          withCredentials: true,
        },
      )
      .pipe(
        tap(() => {
          this.queryCache.updateSnapshot<ListarUsuariosResponse>(this.cacheKeyListagem, (atual) => {
            const usuariosAtuais = atual?.usuarios ?? [];
            const usuarios = usuariosAtuais.filter((item) => String(item.id) !== String(usuarioId));
            return {
              total: usuarios.length,
              usuarios,
            };
          });
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(
                  error?.error,
                  'Nao foi possivel atualizar a senha. Tente novamente.',
                ),
              ),
          ),
        ),
      );
  }

  editarMinhaConta(
    usuarioId: string,
    payload: EditarMinhaContaPayload,
  ): Observable<UsuarioAtualizadoResponse> {
    const body: Record<string, string> = {
      senha_atual: payload.senhaAtual,
    };

    if (payload.nome !== undefined) {
      body['nome'] = payload.nome;
    }

    if (payload.email !== undefined) {
      body['email'] = payload.email;
    }

    if (payload.senhaNova !== undefined) {
      body['senha'] = payload.senhaNova;
    }

    return this.http
      .put<UsuarioAtualizadoResponse>(`${this.apiUrl}?id=${encodeURIComponent(usuarioId)}`, body, {
        withCredentials: true,
      })
      .pipe(
        tap((resposta) => {
          this.queryCache.updateSnapshot<ListarUsuariosResponse>(this.cacheKeyListagem, (atual) => {
            const usuariosAtuais = atual?.usuarios ?? [];
            const usuarioAtualizado: UsuarioListaItem = {
              ...resposta.usuario,
              id: resposta.usuario.id,
            };
            return {
              total: atual?.total ?? usuariosAtuais.length,
              usuarios: usuariosAtuais.map((item) =>
                String(item.id) === String(usuarioId) ? usuarioAtualizado : item,
              ),
            };
          });
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(
                  error?.error,
                  'Nao foi possivel atualizar a senha. Tente novamente.',
                ),
              ),
          ),
        ),
      );
  }
}
