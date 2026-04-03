export interface PacienteItem {
  id: string;
  codigoPaciente: string;
  nome: string;
  dataNascimento: string;
  telefone: string;
  whatsappPush: boolean;
  email: string;
  convenioId: string;
  convenioNome: string;
  numeroCarteirinha: string;
  criadoEm: string;
}

export interface SalvarPacientePayload {
  nome: string;
  dataNascimento: string;
  telefone: string;
  whatsappPush: boolean;
  email: string;
  convenioId: string;
  numeroCarteirinha: string;
}
