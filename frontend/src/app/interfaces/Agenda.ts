export type AgendaStatus = 'agendado' | 'realizado' | 'cancelado';

export interface AgendaConsulta {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  profissionalNome: string;
  status: AgendaStatus;
  dataConsulta: string;
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
  pacienteNome: string;
  profissionalNome: string;
  dataConsulta: string;
  status?: AgendaStatus;
}
