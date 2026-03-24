export type TipoUsuario = 'admin' | 'dentista' | 'recepcionista';

export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
}

export interface SessaoAutenticadaResponse {
  usuario: UsuarioAutenticado;
}

export interface LoginResponse {
  token: string;
  expira_em: string;
  usuario: UsuarioAutenticado;
}
