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

export type PeriodoFaturamento = 'mensal' | 'trimestral' | 'anual';

export interface FaturamentoPeriodo {
  valor: number;
  meta: number;
  crescimento: number;
}

export interface GraficoFaturamentoItem {
  rotulo: string;
  valor: number;
}
