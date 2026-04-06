export type AgendaStatus = 'agendado' | 'realizado' | 'cancelado';

export interface AgendaConsulta {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  codigoPaciente?: string;
  profissionalNome: string;
  status: AgendaStatus;
  dataConsulta: string;
  convenioId?: string;
  convenioNome?: string;
  numeroCarteirinha?: string;
  observacoes?: string;
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

export interface NovoAgendamentoInput {
  pacienteId: string;
  codigoPaciente?: string;
  pacienteNome: string;
  profissionalNome: string;
  dataConsulta: string;
  status?: AgendaStatus;
}
