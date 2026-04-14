/**
 * Formata status de consulta para exibição
 */
export function formatarStatusConsulta(status: string): string {
  const valor = status?.trim();
  if (!valor) {
    return '';
  }

  return valor.charAt(0).toUpperCase() + valor.slice(1);
}
