import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  AgendaConsulta,
  AgendaPaciente,
  AgendaStatus,
  NovoAgendamentoInput,
} from '../interfaces/Agenda';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { QueryCacheService } from './query-cache.service';

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
}

@Injectable({
  providedIn: 'root',
})
export class AgendaService {
  private readonly apiConsultasUrl = '/api/consultas';
  private readonly apiPacientesUrl = '/api/pacientes';
  private readonly cacheKeyConsultas = `${this.apiConsultasUrl}:list:geral`;
  private readonly cacheKeyConsultasAtendimento = `${this.apiConsultasUrl}:list:atendimento`;
  private readonly cacheKeyPacientes = `${this.apiPacientesUrl}:list`;

  private readonly consultasStore = signal<AgendaConsulta[]>([]);

  readonly consultas = this.consultasStore.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: QueryCacheService,
  ) {}

  listarConsultas(
    forcarAtualizacao = false,
    escopo: 'geral' | 'atendimento' = 'geral',
  ): Observable<AgendaConsulta[]> {
    const chaveCache =
      escopo === 'atendimento' ? this.cacheKeyConsultasAtendimento : this.cacheKeyConsultas;

    return this.queryCache.getOrSet(
      chaveCache,
      () =>
        this.http
          .get<ConsultasApiResponse>(this.apiConsultasUrl, {
            withCredentials: true,
            params: escopo === 'atendimento' ? { escopo: 'atendimento' } : undefined,
          })
          .pipe(
            map((resposta) =>
              (resposta.consultas ?? []).map((consulta) => ({
                id: consulta.id,
                pacienteId: consulta.paciente_id,
                pacienteNome: consulta.paciente_nome ?? 'Paciente sem nome',
                codigoPaciente: consulta.codigo_paciente ?? undefined,
                profissionalNome: consulta.usuario_nome ?? 'Profissional nao informado',
                status: consulta.status,
                dataConsulta: consulta.data_consulta,
                convenioId: consulta.convenio_cnpj ?? undefined,
                convenioNome: consulta.convenio_nome ?? undefined,
                numeroCarteirinha: consulta.numero_carteirinha ?? undefined,
                observacoes: consulta.observacoes ?? undefined,
                atualizadoEm: consulta.atualizado_em,
              })),
            ),
            tap((consultas) => this.consultasStore.set(consultas)),
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
      undefined,
      forcarAtualizacao,
    );
  }

  obterConsultasEmCache(escopo: 'geral' | 'atendimento' = 'geral'): AgendaConsulta[] {
    const chaveCache =
      escopo === 'atendimento' ? this.cacheKeyConsultasAtendimento : this.cacheKeyConsultas;
    return this.queryCache.getSnapshot<AgendaConsulta[]>(chaveCache) ?? [];
  }

  atualizarConsulta(
    consultaId: string,
    payload: AtualizarConsultaPayload,
  ): Observable<{ mensagem: string }> {
    const body: Record<string, string> = {
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

    return this.http
      .put<{
        mensagem: string;
      }>(`${this.apiConsultasUrl}?id=${encodeURIComponent(consultaId)}`, body, {
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.atualizarConsultaNosCaches(consultaId, payload);
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
  ): Observable<{ mensagem: string }> {
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
      undefined,
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
          this.removerConsultaDosCaches(consultaId);
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

  registrarAgendamentoLocal(input: NovoAgendamentoInput): AgendaConsulta {
    const novoId = this.proximoIdConsulta();
    const novaConsulta: AgendaConsulta = {
      id: novoId,
      pacienteId: input.pacienteId,
      pacienteNome: input.pacienteNome,
      codigoPaciente: input.codigoPaciente,
      profissionalNome: input.profissionalNome,
      status: input.status ?? 'agendado',
      dataConsulta: input.dataConsulta,
    };

    this.consultasStore.update((consultasAtuais) => [novaConsulta, ...consultasAtuais]);
    return novaConsulta;
  }

  private proximoIdConsulta(): string {
    return `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private atualizarConsultaNosCaches(consultaId: string, payload: AtualizarConsultaPayload): void {
    const atualizarLista = (consultas: AgendaConsulta[] | undefined): AgendaConsulta[] => {
      const listaAtual = consultas ?? [];
      const listaAtualizada = listaAtual.map((consulta) => {
        if (consulta.id !== consultaId) {
          return consulta;
        }

        return {
          ...consulta,
          status: payload.status,
          dataConsulta: payload.dataConsulta?.trim()
            ? payload.dataConsulta.trim()
            : consulta.dataConsulta,
          observacoes:
            payload.observacoes !== undefined ? payload.observacoes : consulta.observacoes,
          numeroCarteirinha:
            payload.numeroCarteirinha !== undefined
              ? payload.numeroCarteirinha
              : consulta.numeroCarteirinha,
          convenioId: payload.convenioId !== undefined ? payload.convenioId : consulta.convenioId,
          atualizadoEm: new Date().toISOString(),
        };
      });

      this.consultasStore.set(listaAtualizada);
      return listaAtualizada;
    };

    this.queryCache.updateSnapshot<AgendaConsulta[]>(this.cacheKeyConsultas, (atual) =>
      atualizarLista(atual),
    );
    this.queryCache.updateSnapshot<AgendaConsulta[]>(this.cacheKeyConsultasAtendimento, (atual) =>
      atualizarLista(atual),
    );
  }

  private removerConsultaDosCaches(consultaId: string): void {
    const removerDaLista = (consultas: AgendaConsulta[] | undefined): AgendaConsulta[] => {
      const listaAtualizada = (consultas ?? []).filter((consulta) => consulta.id !== consultaId);
      this.consultasStore.set(listaAtualizada);
      return listaAtualizada;
    };

    this.queryCache.updateSnapshot<AgendaConsulta[]>(this.cacheKeyConsultas, (atual) =>
      removerDaLista(atual),
    );
    this.queryCache.updateSnapshot<AgendaConsulta[]>(this.cacheKeyConsultasAtendimento, (atual) =>
      removerDaLista(atual),
    );
  }
}
