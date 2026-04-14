/**
 * Trunca texto longo para exibição em tabelas e listas.
 */
export function formatarTextoCurto(valor: unknown, limite = 42): string {
  if (typeof valor !== 'string' || !valor.trim()) {
    return '-';
  }

  const texto = valor.trim();
  return texto.length > limite ? `${texto.slice(0, limite)}...` : texto;
}
