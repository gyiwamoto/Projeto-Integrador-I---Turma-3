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
import { QueryCacheService } from './query-cache.service';

interface ErroApiResponse {
  erro?: string;
}

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
  usuario_id: string;
  usuario_nome: string | null;
  status: AgendaStatus;
  data_consulta: string;
  convenio_id: string | null;
  convenio_nome: string | null;
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
  convenio_id: string | null;
  convenio_nome: string | null;
  numero_carteirinha: string | null;
  criado_em: string;
}

@Injectable({
  providedIn: 'root',
})
export class AgendaService {
  private readonly apiConsultasUrl = '/api/consultas';
  private readonly apiPacientesUrl = '/api/pacientes';
  private readonly cacheKeyConsultas = `${this.apiConsultasUrl}:list`;
  private readonly cacheKeyPacientes = `${this.apiPacientesUrl}:list`;

  private readonly consultasStore = signal<AgendaConsulta[]>([]);

  readonly consultas = this.consultasStore.asReadonly();

  constructor(
    private readonly http: HttpClient,
    private readonly queryCache: QueryCacheService,
  ) {}

  listarConsultas(): Observable<AgendaConsulta[]> {
    return this.queryCache.getOrSet(this.cacheKeyConsultas, () =>
      this.http.get<ConsultasApiResponse>(this.apiConsultasUrl, { withCredentials: true }).pipe(
        map((resposta) =>
          (resposta.consultas ?? []).map((consulta) => ({
            id: consulta.id,
            pacienteId: consulta.paciente_id,
            pacienteNome: consulta.paciente_nome ?? 'Paciente sem nome',
            profissionalNome: consulta.usuario_nome ?? 'Profissional nao informado',
            status: consulta.status,
            dataConsulta: consulta.data_consulta,
          })),
        ),
        tap((consultas) => this.consultasStore.set(consultas)),
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      ),
    );
  }

  listarPacientes(): Observable<AgendaPaciente[]> {
    return this.queryCache.getOrSet(this.cacheKeyPacientes, () =>
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
        catchError((error) => throwError(() => new Error(this.extrairMensagemErro(error?.error)))),
      ),
    );
  }

  registrarAgendamentoLocal(input: NovoAgendamentoInput): AgendaConsulta {
    const novoId = this.proximoIdConsulta();
    const novaConsulta: AgendaConsulta = {
      id: novoId,
      pacienteId: input.pacienteId,
      pacienteNome: input.pacienteNome,
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

  private extrairMensagemErro(payload: ErroApiResponse | undefined): string {
    if (payload && typeof payload.erro === 'string' && payload.erro.trim()) {
      return payload.erro;
    }

    return 'Nao foi possivel carregar dados da agenda.';
  }
}
