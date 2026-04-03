import { HttpInterceptorFn } from '@angular/common/http';

function obterCookie(nome: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie?.split(';') ?? [];
  const prefixo = `${nome}=`;

  for (const cookie of cookies) {
    const item = cookie.trim();
    if (!item.startsWith(prefixo)) {
      continue;
    }

    const bruto = item.substring(prefixo.length);
    const valor = decodeURIComponent(bruto);
    return valor;
  }

  return null;
}

function normalizarBearer(valor: string): string {
  const token = valor.trim();

  if (/^bearer\s+/i.test(token)) {
    return token;
  }

  return `Bearer ${token}`;
}

export const bearerTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const tokenCookie = obterCookie('BearerToken');
  if (!tokenCookie) {
    return next(req);
  }

  const autorizacao = normalizarBearer(tokenCookie);

  return next(
    req.clone({
      setHeaders: {
        Authorization: autorizacao,
      },
    }),
  );
};
