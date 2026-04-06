export interface ConvenioItem {
  id: string;
  nome: string;
  cnpj?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface SalvarConvenioPayload {
  nome: string;
  cnpj?: string;
  ativo: boolean;
}
