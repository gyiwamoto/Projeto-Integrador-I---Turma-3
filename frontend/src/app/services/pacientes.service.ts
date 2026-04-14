import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PacienteItem, SalvarPacientePayload } from '../interfaces/Paciente';
import { extrairMensagemErroApi } from '../utils/extrair-mensagem-erro-api';
import { CacheStoreService } from './cache-store.service';

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

interface ListarPacientesOpcoes {
  forcarAtualizacao?: boolean;
  intervalo?: {
    dataInicio?: string;
    dataFim?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PacientesService {
  private readonly apiUrl = '/api/pacientes';
  private readonly cacheKeyListagem = 'patients:list';
  private readonly ttlPacientesMs = 3 * 60 * 1000;

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: CacheStoreService,
  ) {}

  private chavePaciente(id: string): string {
    return `patient:${id}`;
  }

  private chaveListagem(intervalo?: { dataInicio?: string; dataFim?: string }): string {
    if (!intervalo?.dataInicio && !intervalo?.dataFim) {
      return this.cacheKeyListagem;
    }

    return `${this.cacheKeyListagem}:inicio=${intervalo?.dataInicio ?? ''}:fim=${intervalo?.dataFim ?? ''}`;
  }

  listarPacientes(opcoes: ListarPacientesOpcoes = {}): Observable<ListarPacientesResponse> {
    const forcarAtualizacao = Boolean(opcoes.forcarAtualizacao);
    let params = new HttpParams();

    if (opcoes.intervalo?.dataInicio) {
      params = params.set('data_inicio', opcoes.intervalo.dataInicio);
    }

    if (opcoes.intervalo?.dataFim) {
      params = params.set('data_fim', opcoes.intervalo.dataFim);
    }

    return this.queryCache.getOrSet(
      this.chaveListagem(opcoes.intervalo),
      () =>
        this.http
          .get<{
            total: number;
            pacientes: PacienteApiItem[];
          }>(this.apiUrl, { withCredentials: true, params })
          .pipe(
            map((resposta) => ({
              total: resposta.total,
              pacientes: (resposta.pacientes ?? []).map((item) => this.mapearPaciente(item)),
            })),
            tap((resposta) => {
              for (const paciente of resposta.pacientes) {
                this.queryCache.setSnapshot<PacienteItem>(
                  this.chavePaciente(paciente.id),
                  paciente,
                  this.ttlPacientesMs,
                );
              }
            }),
            catchError((error) =>
              throwError(
                () =>
                  new Error(
                    extrairMensagemErroApi(
                      error?.error,
                      'Nao foi possivel processar os pacientes.',
                    ),
                  ),
              ),
            ),
          ),
      this.ttlPacientesMs,
      forcarAtualizacao,
    );
  }

  criarPaciente(payload: SalvarPacientePayload): Observable<SalvarPacienteResponse> {
    return this.http
      .post<{ mensagem: string; paciente: PacienteApiItem }>(
        this.apiUrl,
        {
          nome: payload.nome.trim(),
          data_nascimento: this.normalizarDataNascimento(payload.dataNascimento),
          telefone: payload.telefone.trim() || null,
          whatsapp_push: payload.whatsappPush,
          email: payload.email.trim() || null,
          convenio_cnpj: payload.convenioId || null,
          numero_carteirinha: payload.numeroCarteirinha.trim() || null,
        },
        { withCredentials: true },
      )
      .pipe(
        map((resposta) => ({
          mensagem: resposta.mensagem,
          paciente: this.mapearPaciente(resposta.paciente),
        })),
        tap((resposta) => {
          this.queryCache.setSnapshot<PacienteItem>(
            this.chavePaciente(resposta.paciente.id),
            resposta.paciente,
            this.ttlPacientesMs,
          );
          this.queryCache.updateSnapshot<ListarPacientesResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const pacientesAtuais = atual?.pacientes ?? [];
              return {
                total: (atual?.total ?? pacientesAtuais.length) + 1,
                pacientes: [resposta.paciente, ...pacientesAtuais],
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os pacientes.'),
              ),
          ),
        ),
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
          data_nascimento: this.normalizarDataNascimento(payload.dataNascimento),
          telefone: payload.telefone.trim() || null,
          whatsapp_push: payload.whatsappPush,
          email: payload.email.trim() || null,
          convenio_cnpj: payload.convenioId || null,
          numero_carteirinha: payload.numeroCarteirinha.trim() || null,
        },
        { withCredentials: true },
      )
      .pipe(
        map((resposta) => ({
          mensagem: resposta.mensagem,
          paciente: this.mapearPaciente(resposta.paciente),
        })),
        tap((resposta) => {
          this.queryCache.setSnapshot<PacienteItem>(
            this.chavePaciente(resposta.paciente.id),
            resposta.paciente,
            this.ttlPacientesMs,
          );
          this.queryCache.updateSnapshot<ListarPacientesResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const pacientesAtuais = atual?.pacientes ?? [];
              return {
                total: atual?.total ?? pacientesAtuais.length,
                pacientes: pacientesAtuais.map((item) =>
                  item.id === resposta.paciente.id ? resposta.paciente : item,
                ),
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os pacientes.'),
              ),
          ),
        ),
      );
  }

  excluirPaciente(pacienteId: string): Observable<ExcluirPacienteResponse> {
    return this.http
      .delete<ExcluirPacienteResponse>(`${this.apiUrl}?id=${encodeURIComponent(pacienteId)}`, {
        withCredentials: true,
      })
      .pipe(
        tap(() => {
          this.queryCache.invalidate(this.chavePaciente(pacienteId));
          this.queryCache.updateSnapshot<ListarPacientesResponse>(
            this.cacheKeyListagem,
            (atual) => {
              const pacientesAtuais = atual?.pacientes ?? [];
              const pacientes = pacientesAtuais.filter((item) => item.id !== pacienteId);
              return {
                total: pacientes.length,
                pacientes,
              };
            },
          );
        }),
        catchError((error) =>
          throwError(
            () =>
              new Error(
                extrairMensagemErroApi(error?.error, 'Nao foi possivel processar os pacientes.'),
              ),
          ),
        ),
      );
  }

  private mapearPaciente(item: PacienteApiItem): PacienteItem {
    return {
      id: item.id,
      codigoPaciente: item.codigo_paciente,
      nome: item.nome,
      dataNascimento: this.formatarDataNascimentoBr(item.data_nascimento) ?? '',
      telefone: item.telefone ?? '',
      whatsappPush: Boolean(item.whatsapp_push),
      email: item.email ?? '',
      convenioId: item.convenio_cnpj ?? '',
      convenioNome: item.convenio_nome ?? '',
      numeroCarteirinha: item.numero_carteirinha ?? '',
      criadoEm: item.criado_em,
    };
  }

  private normalizarDataNascimento(valor: string | null | undefined): string | null {
    if (!valor || !valor.trim()) {
      return null;
    }

    const texto = valor.trim();

    const formatoBr = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (formatoBr) {
      const dia = formatoBr[1];
      const mes = formatoBr[2];
      const ano = formatoBr[3];
      return `${ano}-${mes}-${dia}`;
    }

    const trechoData = texto.match(/\d{4}-\d{2}-\d{2}/)?.[0];
    if (trechoData) {
      return trechoData;
    }

    const data = new Date(texto);
    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return data.toISOString().slice(0, 10);
  }

  private formatarDataNascimentoBr(valor: string | null | undefined): string | null {
    const normalizada = this.normalizarDataNascimento(valor);
    if (!normalizada) {
      return null;
    }

    const [ano, mes, dia] = normalizada.split('-');
    if (!ano || !mes || !dia) {
      return null;
    }

    return `${dia}/${mes}/${ano}`;
  }
}
