export interface Procedimento {
  codigo: string;
  nome: string;
  tempoMinutos: number;
}

export const PROCEDIMENTOS: Procedimento[] = [
  { codigo: '100', nome: 'AVALIACAO + LIMPEZA', tempoMinutos: 30 },
  { codigo: '110', nome: 'EXTRACAO', tempoMinutos: 30 },
  { codigo: '120', nome: 'RESTAURACAO', tempoMinutos: 30 },
  { codigo: '130', nome: 'PROTESE', tempoMinutos: 30 },
  { codigo: '140', nome: 'CANAL', tempoMinutos: 90 },
  { codigo: '150', nome: 'IMPLANTE', tempoMinutos: 60 },
  { codigo: '160', nome: 'LIMPEZA', tempoMinutos: 30 },
  { codigo: '170', nome: 'MANUTENCAO ORTODONTIA', tempoMinutos: 30 },
  { codigo: '171', nome: 'MONTAGEM', tempoMinutos: 30 },
  { codigo: '180', nome: 'HOF', tempoMinutos: 60 },
  { codigo: '115', nome: 'EXTRACAO 3o. MOLAR', tempoMinutos: 120 },
];

export const PROCEDIMENTOS_FIXOS = PROCEDIMENTOS;
