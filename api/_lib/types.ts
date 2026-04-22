export type TipoUsuario = 'admin' | 'dentista' | 'recepcionista';

export interface Usuario {
	id: string;
	nome: string;
	email: string;
	senha: string;
	tipo_usuario: TipoUsuario;
	criado_em: string;
}

export interface CriarUsuarioInput {
	nome: string;
	email: string;
	senha: string;
	tipo_usuario: TipoUsuario;
}

export interface JwtUsuarioPayload {
	id: string;
	nome: string;
	email: string;
	tipo_usuario: TipoUsuario;
}

export interface ConsultaWhatsapp {
  id: string;
  data_consulta: string;
  paciente_nome: string;
  telefone: string;
  dentista_nome: string;
}
