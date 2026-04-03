export interface ConvenioItem {
  id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface SalvarConvenioPayload {
  nome: string;
  ativo: boolean;
}
