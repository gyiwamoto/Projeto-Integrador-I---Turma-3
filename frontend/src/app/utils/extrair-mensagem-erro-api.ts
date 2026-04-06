interface ErroApiPadrao {
  erro?: unknown;
  mensagem?: unknown;
}

export function extrairMensagemErroApi(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const erroApi = payload as ErroApiPadrao;

    if (typeof erroApi.erro === 'string' && erroApi.erro.trim()) {
      return erroApi.erro;
    }

    if (typeof erroApi.mensagem === 'string' && erroApi.mensagem.trim()) {
      return erroApi.mensagem;
    }
  }

  return fallback;
}
