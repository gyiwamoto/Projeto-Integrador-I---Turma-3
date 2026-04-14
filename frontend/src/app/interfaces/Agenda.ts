export type AgendaStatus = 'agendado' | 'realizado' | 'cancelado';

export interface AgendaConsulta {
  id: string;
  pacienteId: string;
  usuarioId: string;
  pacienteNome: string;
  codigoPaciente?: string;
  profissionalNome: string;
  status: AgendaStatus;
  dataConsulta: string;
  convenioId?: string;
  convenioNome?: string;
  numeroCarteirinha?: string;
  observacoes?: string;
  procedimentosAgendados?: string[];
  duracaoEstimadaMin?: number;
  atualizadoEm?: string;
}

export interface AgendaPaciente {
  id: string;
  codigoPaciente: string;
  nome: string;
  telefone: string;
  email: string;
  numeroCarteirinha: string;
}
