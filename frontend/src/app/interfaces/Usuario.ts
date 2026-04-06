export type TipoUsuario = 'admin' | 'dentista' | 'recepcionista';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
}

export interface UsuarioListaItem {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  criado_em: string;
}

export interface CriarUsuarioPayload {
  nome: string;
  email: string;
  senha: string;
  tipo_usuario: TipoUsuario;
}

export interface EditarUsuarioPayload {
  nome?: string;
  email?: string;
  senha?: string;
  tipo_usuario?: TipoUsuario;
}

export interface EditarMinhaContaPayload {
  nome?: string;
  email?: string;
  senhaAtual: string;
  senhaNova?: string;
}

export interface SessaoAutenticadaResponse {
  usuario: UsuarioAutenticado;
}

export interface LoginResponse {
  token: string;
  expira_em: string;
  usuario: UsuarioAutenticado;
}
