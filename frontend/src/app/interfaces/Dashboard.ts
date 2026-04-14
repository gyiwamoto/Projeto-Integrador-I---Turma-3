export interface ProximaConsulta {
  id: string;
  horario: string;
  paciente: string;
  dentista: string;
  procedimento: string;
}

export interface ProcedimentoResumo {
  nome: string;
  total: number;
  percentual: number;
}

export interface ConvenioResumo {
  nome: string;
  consultas: number;
  percentual: number;
}
