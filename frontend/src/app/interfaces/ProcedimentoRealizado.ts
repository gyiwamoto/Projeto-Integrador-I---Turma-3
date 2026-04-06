import type { TabelaLinha } from '../components/tabela/tabela.component';

export interface ProcedimentoRealizadoItem extends TabelaLinha {
  [chave: string]: unknown;
  id: string;
  consultaId: string;
  tratamentoId: string;
  tratamentoNome: string;
  dente: number | null;
  face: string | null;
  dataProcedimento: string;
  observacoes: string;
  criadoEm: string;
}

export interface SalvarProcedimentoRealizadoPayload {
  consultaId: string;
  tratamentoId: string;
  dente: number;
  face: string;
  dataProcedimento: string;
  observacoes: string;
}
