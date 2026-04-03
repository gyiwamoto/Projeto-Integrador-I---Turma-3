import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PacienteItem, SalvarPacientePayload } from '../interfaces/Paciente';
import { QueryCacheService } from './query-cache.service';

interface ErroApiResponse {
  erro?: string;
}

interface PacienteApiItem {
  id: string;
  codigo_paciente: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
  whatsapp_push: boolean;
  email: string | null;
  convenio_id: string | null;
  convenio_nome: string | null;
  numero_carteirinha: string | null;
  criado_em: string;
}

export interface ListarPacientesResponse {
  total: number;
  pacientes: PacienteItem[];
}

export interface SalvarPacienteResponse {
  mensagem: string;
  paciente: PacienteItem;
}

export interface ExcluirPacienteResponse {
  mensagem: string;
}

@Injectable({
  providedIn: 'root',
})
export class PacientesService {
  private readonly apiUrl = '/api/pacientes';
  private readonly cacheKeyListagem = `${this.apiUrl}:list`;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: QueryCacheService,
  ) {}

  listarPacientes(): Observable<ListarPacientesResponse> {
    return this.queryCache.getOrSet(this.cacheKeyListagem, () =>
      this.http
        .get<{
          total: number;
          pacientes: PacienteApiItem[];
        }>(this.apiUrl, { withCredentials: true })
        .pipe(
          map((resposta) => ({
            total: resposta.total,
            pacientes: (resposta.pacientes ?? []).map((item) => this.mapearPaciente(item)),
          })),
          catchError((error) =>
            throwError(() => new Error(this.extrairMensagemErro(error?.error))),
          ),
        ),
    );
  }

  criarPaciente(payload: SalvarPacientePayload): Observable<SalvarPacienteResponse> {
    return this.http
      .post<{ mensagem: string; paciente: PacienteApiItem }>(
        this.apiUrl,
        {
          nome: payload.nome.trim(),
          data_nascimento: payload.dataNascimento || null,
          telefone: payload.telefone.trim() || null,
          whatsapp_push: payload.whatsappPush,
          email: payload.email.trim() || null,
          convenio_id: payload.convenioId || null,
          numero_carteirinha: payload.numeroCarteirinha.trim() || null,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        map((resposta) => ({
          mensagem: resposta.mensagem,
          paciente: this.mapearPaciente(resposta.paciente),
        })),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  editarPaciente(
    pacienteId: string,
    payload: SalvarPacientePayload,
  ): Observable<SalvarPacienteResponse> {
    return this.http
      .put<{ mensagem: string; paciente: PacienteApiItem }>(
        `${this.apiUrl}?id=${encodeURIComponent(pacienteId)}`,
        {
          nome: payload.nome.trim(),
          data_nascimento: payload.dataNascimento || null,
          telefone: payload.telefone.trim() || null,
          whatsapp_push: payload.whatsappPush,
          email: payload.email.trim() || null,
          convenio_id: payload.convenioId || null,
          numero_carteirinha: payload.numeroCarteirinha.trim() || null,
        },
        { withCredentials: true },
      )
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        map((resposta) => ({
          mensagem: resposta.mensagem,
          paciente: this.mapearPaciente(resposta.paciente),
        })),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  excluirPaciente(pacienteId: string): Observable<ExcluirPacienteResponse> {
    return this.http
      .delete<ExcluirPacienteResponse>(`${this.apiUrl}?id=${encodeURIComponent(pacienteId)}`, {
        withCredentials: true,
      })
      .pipe(
        tap(() => this.queryCache.invalidate(this.cacheKeyListagem)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      );
  }

  private mapearPaciente(item: PacienteApiItem): PacienteItem {
    return {
      id: item.id,
      codigoPaciente: item.codigo_paciente,
      nome: item.nome,
      dataNascimento: item.data_nascimento ?? '',
      telefone: item.telefone ?? '',
      whatsappPush: Boolean(item.whatsapp_push),
      email: item.email ?? '',
      convenioId: item.convenio_id ?? '',
      convenioNome: item.convenio_nome ?? '',
      numeroCarteirinha: item.numero_carteirinha ?? '',
      criadoEm: item.criado_em,
    };
  }

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel processar os pacientes.';
  }
}
