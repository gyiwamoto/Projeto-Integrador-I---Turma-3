import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AgendaConsulta, AgendaPaciente, AgendaStatus } from '../interfaces/Agenda';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { CacheStoreService } from './cache-store.service';

interface ConsultasApiResponse {
  total: number;
  consultas: ConsultaApiItem[];
}

interface PacientesApiResponse {
  total: number;
  pacientes: PacienteApiItem[];
}

interface ConsultaApiItem {
  id: string;
  paciente_id: string;
  paciente_nome: string | null;
  codigo_paciente: string | null;
  usuario_id: string;
  usuario_nome: string | null;
  status: AgendaStatus;
  data_consulta: string;
  convenio_cnpj: string | null;
  convenio_nome: string | null;
  numero_carteirinha: string | null;
  observacoes: string | null;
  procedimentos_agendados: string[] | null;
  duracao_estimada_min: number | null;
  atualizado_em: string;
  criado_em: string;
}

interface PacienteApiItem {
  id: string;
  codigo_paciente: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
  whatsapp_push: boolean;
  email: string | null;
  convenio_cnpj: string | null;
  convenio_nome: string | null;
  numero_carteirinha: string | null;
  criado_em: string;
}

export interface AtualizarConsultaPayload {
  status: AgendaStatus;
  dataConsulta?: string;
  observacoes?: string;
  numeroCarteirinha?: string;
  convenioId?: string;
  procedimentosAgendados?: string[];
  duracaoEstimadaMin?: number;
}

export interface CriarConsultaPayload {
  pacienteId: string;
  dataConsulta: string;
  status?: AgendaStatus;
  observacoes?: string;
  numeroCarteirinha?: string;
  convenioId?: string;
  usuarioId?: string;
  procedimentosAgendados?: string[];
  duracaoEstimadaMin?: number;
}

export interface IntervaloConsulta {
  dataInicio?: string;
  dataFim?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgendaService {
  private readonly apiConsultasUrl = '/api/consultas';
  private readonly apiPacientesUrl = '/api/pacientes';
  private readonly cacheKeyConsultas = 'consultas:list';
  private readonly cacheKeyPacientes = 'pacientes:list';
  private readonly ttlConsultasMs = 45 * 1000;
  private readonly ttlPacientesMs = 3 * 60 * 1000;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: CacheStoreService,
  ) {}

  private mapearConsultaApi(consulta: ConsultaApiItem): AgendaConsulta {
    return {
      id: consulta.id,
      pacienteId: consulta.paciente_id,
      usuarioId: consulta.usuario_id,
      pacienteNome: consulta.paciente_nome ?? 'Paciente sem nome',
      codigoPaciente: consulta.codigo_paciente ?? undefined,
      profissionalNome: consulta.usuario_nome ?? 'Profissional nao informado',
      status: consulta.status,
      dataConsulta: consulta.data_consulta,
      convenioId: consulta.convenio_cnpj ?? undefined,
      convenioNome: consulta.convenio_nome ?? undefined,
      numeroCarteirinha: consulta.numero_carteirinha ?? undefined,
      observacoes: consulta.observacoes ?? undefined,
      procedimentosAgendados: consulta.procedimentos_agendados ?? undefined,
      duracaoEstimadaMin: consulta.duracao_estimada_min ?? undefined,
      atualizadoEm: consulta.atualizado_em,
    };
  }

  listarConsultas(
    forcarAtualizacao = false,
    escopo: 'geral' | 'atendimento' = 'geral',
    intervalo?: IntervaloConsulta,
  ): Observable<AgendaConsulta[]> {
    // Chave simples de cache
    const chaveCache = this.cacheKeyConsultas;

    let params = new HttpParams();
    if (escopo === 'atendimento') {
      params = params.set('escopo', 'atendimento');
    }
    if (intervalo?.dataInicio) {
      params = params.set('data_inicio', intervalo.dataInicio);
    }
    if (intervalo?.dataFim) {
      params = params.set('data_fim', intervalo.dataFim);
    }

    return this.queryCache.getOrSet(
      chaveCache,
      () =>
        this.http
          .get<ConsultasApiResponse>(this.apiConsultasUrl, {
            withCredentials: true,
            params,
          })
          .pipe(
            map((resposta) =>
              (resposta.consultas ?? []).map((consulta) => this.mapearConsultaApi(consulta)),
            ),
            catchError((error) =>
              throwError(
                () =>
                  new Error(
                    extrairMensagemErroApi(
                      error?.error,
                      'Nao foi possivel carregar dados da agenda.',
                    ),
                  ),
              ),
            ),
          ),
      this.ttlConsultasMs,
      forcarAtualizacao,
    );
  }

  /**
   * Retorna consultas em cache (mesmo que expiradas)
   */
  obterConsultasEmCache(): AgendaConsulta[] {
    return this.queryCache.getSnapshot<AgendaConsulta[]>(this.cacheKeyConsultas) ?? [];
  }

  criarConsulta(
    payload: CriarConsultaPayload,
  ): Observable<{ mensagem: string; consulta: AgendaConsulta }> {
    const body: Record<string, unknown> = {
      paciente_id: payload.pacienteId,
      data_consulta: payload.dataConsulta,
      status: payload.status ?? 'agendado',
    };

    if (payload.observacoes !== undefined) {
      body['observacoes'] = payload.observacoes;
    }

    if (payload.numeroCarteirinha?.trim()) {
      body['numero_carteirinha'] = payload.numeroCarteirinha.trim();
    }

    if (payload.convenioId?.trim()) {
      body['convenio_cnpj'] = payload.convenioId.trim();
    }

    if (payload.usuarioId?.trim()) {
      body['usuario_id'] = payload.usuarioId.trim();
    }

    if (payload.procedimentosAgendados?.length) {
      body['procedimentos_agendados'] = payload.procedimentosAgendados;
    }

    if (typeof payload.duracaoEstimadaMin === 'number' && payload.duracaoEstimadaMin > 0) {
      body['duracao_estimada_min'] = payload.duracaoEstimadaMin;
    }

    return this.http
      .post<{ mensagem: string; consulta: ConsultaApiItem }>(this.apiConsultasUrl, body, {
        withCredentials: true,
      })
      .pipe(
        map((resposta) => ({
          mensagem: resposta.mensagem,
          consulta: this.mapearConsultaApi(resposta.consulta),
        })),
        tap(() => {
          // Invalida cache para forçar refresh na próxima vez
          this.queryCache.invalidate(this.cacheKeyConsultas);
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(extrairMensagemErroApi(error?.error, 'Nao foi possivel criar a consulta.')),
          ),
        ),
      );
  }

  atualizarConsulta(
    consultaId: string,
    payload: AtualizarConsultaPayload,
  ): Observable<{ mensagem: string; consulta: AgendaConsulta }> {
    const body: Record<string, unknown> = {
      status: payload.status,
    };

    if (payload.dataConsulta?.trim()) {
      body['data_consulta'] = payload.dataConsulta.trim();
    }

    if (payload.observacoes !== undefined) {
      body['observacoes'] = payload.observacoes;
    }

    if (payload.numeroCarteirinha?.trim()) {
      body['numero_carteirinha'] = payload.numeroCarteirinha.trim();
    }

    if (payload.convenioId?.trim()) {
      body['convenio_cnpj'] = payload.convenioId.trim();
    }

    if (payload.procedimentosAgendados?.length) {
      body['procedimentos_agendados'] = payload.procedimentosAgendados;
    }

    if (typeof payload.duracaoEstimadaMin === 'number' && payload.duracaoEstimadaMin > 0) {
      body['duracao_estimada_min'] = payload.duracaoEstimadaMin;
    }

    return this.http
      .put<{
        mensagem: string;
        consulta: ConsultaApiItem;
      }>(`${this.apiConsultasUrl}?id=${encodeURIComponent(consultaId)}`, body, {
        withCredentials: true,
      })
      .pipe(
        map((resposta) => ({
          mensagem: resposta.mensagem,
          consulta: this.mapearConsultaApi(resposta.consulta),
        })),
        tap(() => {
          // Invalida cache para forçar refresh na próxima vez
          this.queryCache.invalidate(this.cacheKeyConsultas);
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel atualizar a consulta.'),
              ),
          ),
        ),
      );
  }

  atualizarStatusConsulta(
    consultaId: string,
    status: AgendaStatus,
  ): Observable<{ mensagem: string; consulta: AgendaConsulta }> {
    return this.atualizarConsulta(consultaId, { status });
  }

  listarPacientes(forcarAtualizacao = false): Observable<AgendaPaciente[]> {
    return this.queryCache.getOrSet(
      this.cacheKeyPacientes,
      () =>
        this.http.get<PacientesApiResponse>(this.apiPacientesUrl, { withCredentials: true }).pipe(
          map((resposta) =>
            (resposta.pacientes ?? []).map((paciente) => ({
              id: paciente.id,
              codigoPaciente: paciente.codigo_paciente,
              nome: paciente.nome,
              telefone: paciente.telefone ?? '',
              email: paciente.email ?? '',
              numeroCarteirinha: paciente.numero_carteirinha ?? '',
            })),
          ),
          catchError((error) =>
            throwError(
              () =>
                new Error(
                  extrairMensagemErroApi(
                    error?.error,
                    'Nao foi possivel carregar dados da agenda.',
                  ),
                ),
            ),
          ),
        ),
      this.ttlPacientesMs,
      forcarAtualizacao,
    );
  }

  excluirConsulta(consultaId: string): Observable<{ mensagem: string }> {
    return this.http
      .delete<{
        mensagem: string;
      }>(`${this.apiConsultasUrl}?id=${encodeURIComponent(consultaId)}`, { withCredentials: true })
      .pipe(
        tap(() => {
          // Invalida cache para forçar refresh na próxima vez
          this.queryCache.invalidate(this.cacheKeyConsultas);
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel excluir a consulta.'),
              ),
          ),
        ),
      );
  }
}
