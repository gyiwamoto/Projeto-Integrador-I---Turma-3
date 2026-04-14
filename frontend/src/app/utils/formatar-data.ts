type FormatoData = 'exibicao' | 'input' | 'backend';

function parsearData(valor: unknown): Date | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }

  if (typeof valor !== 'string') {
    return null;
  }

  const texto = valor.trim();
  if (!texto) {
    return null;
  }

  const padraoBr = texto.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (padraoBr) {
    const dia = Number(padraoBr[1]);
    const mes = Number(padraoBr[2]) - 1;
    const ano = Number(padraoBr[3]);
    const hora = Number(padraoBr[4] ?? '0');
    const minuto = Number(padraoBr[5] ?? '0');
    return new Date(ano, mes, dia, hora, minuto);
  }

  const padraoInputData = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (padraoInputData) {
    const ano = Number(padraoInputData[1]);
    const mes = Number(padraoInputData[2]) - 1;
    const dia = Number(padraoInputData[3]);
    return new Date(ano, mes, dia, 0, 0);
  }

  const padraoInputDataHora = texto.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (padraoInputDataHora) {
    const ano = Number(padraoInputDataHora[1]);
    const mes = Number(padraoInputDataHora[2]) - 1;
    const dia = Number(padraoInputDataHora[3]);
    const hora = Number(padraoInputDataHora[4]);
    const minuto = Number(padraoInputDataHora[5]);
    return new Date(ano, mes, dia, hora, minuto);
  }

  // Suporte a ISO completo vindo da API (ex.: 2026-04-14T03:00:00.000Z).
  const isoComTimezone = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/,
  );
  if (isoComTimezone) {
    const dataIso = new Date(texto);
    return Number.isNaN(dataIso.getTime()) ? null : dataIso;
  }

  return null;
}

function formatarValorData(data: Date, formato: FormatoData, incluirHora: boolean): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  if (formato === 'input') {
    return incluirHora
      ? `${ano}-${mes}-${dia}T${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
      : `${ano}-${mes}-${dia}`;
  }

  if (formato === 'backend') {
    return incluirHora
      ? `${dia}-${mes}-${ano} ${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
      : `${dia}-${mes}-${ano}`;
  }

  return incluirHora
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(data)
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(data);
}

export function formatarData(valor: unknown, formato: FormatoData = 'exibicao'): string {
  const data = parsearData(valor);
  if (!data) {
    return typeof valor === 'string' ? valor : '-';
  }

  return formatarValorData(data, formato, false);
}

export function formatarDataHora(valor: unknown, formato: FormatoData = 'exibicao'): string {
  const data = parsearData(valor);
  if (!data) {
    return typeof valor === 'string' ? valor : '-';
  }

  return formatarValorData(data, formato, true);
}

export function formatarIntervaloDatas(
  inicio: Date,
  fim: Date,
  formato: FormatoData = 'backend',
): { dataInicio: string; dataFim: string } {
  return {
    dataInicio: formatarValorData(inicio, formato, false),
    dataFim: formatarValorData(fim, formato, false),
  };
}

// Compatibilidade temporaria com os nomes antigos.
export function extrairApenasData(valor: string): string {
  return formatarData(valor, 'input');
}

export function formatarDataChaveLocal(valor: unknown): string {
  return formatarData(valor, 'input');
}

export function formatarDataHoraBr(data: Date): string {
  return formatarDataHora(data, 'backend');
}

export function converterIsoParaDateTimeLocal(valor: string): string {
  return formatarDataHora(valor, 'input');
}

export function converterDateTimeLocalParaDataHoraBr(valor: string): string | null {
  const formatado = formatarDataHora(valor, 'backend');
  return formatado === '-' ? null : formatado;
}

export function obterDataAtualChaveLocal(): string {
  return formatarData(new Date(), 'input');
}

export function formatarDataInputLocal(data: Date): string {
  return formatarData(data, 'input');
}

export function obterDataAtualIso(): string {
  return formatarDataHora(new Date(), 'backend');
}

export function formatarParaChaveIntervalo(data: Date): string {
  return formatarData(data, 'backend');
}
