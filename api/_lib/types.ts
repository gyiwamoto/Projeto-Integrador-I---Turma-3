export type TipoUsuario = 'admin' | 'operador';

export interface Usuario {
	id: number;
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
	sub: string;
	id: number;
	nome: string;
	email: string;
	tipo_usuario: TipoUsuario;
}
