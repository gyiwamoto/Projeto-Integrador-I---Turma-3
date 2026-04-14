const DEFAULT_BUSINESS_TIMEZONE = 'America/Sao_Paulo';

const REGEX_DATA_BR = /^(\d{2})-(\d{2})-(\d{4})$/;
const REGEX_DATA_HORA_BR = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/;
const REGEX_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const REGEX_DATA_HORA_ISO_LOCAL =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/;
const REGEX_DATA_HORA_ISO_COM_TZ =
  /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/;

function dataValida(ano: number, mes: number, dia: number): boolean {
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function horaValida(hora: number, minuto: number): boolean {
  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
}

export function obterTimezoneNegocio(): string {
  const timezone = process.env.DB_TIMEZONE;
  if (typeof timezone === 'string' && timezone.trim()) {
    return timezone.trim();
  }

  return DEFAULT_BUSINESS_TIMEZONE;
}

export function normalizarDataHoraIsoUtc(valor: string): string | null {
  const texto = valor.trim();
  if (!texto) {
    return null;
  }

  // Aceita padrao brasileiro DD-MM-YYYY HH:MM e converte para formato local do banco.
  const matchBrDataHora = texto.match(REGEX_DATA_HORA_BR);
  if (matchBrDataHora) {
    const dia = Number(matchBrDataHora[1]);
    const mes = Number(matchBrDataHora[2]);
    const ano = Number(matchBrDataHora[3]);
    const hora = Number(matchBrDataHora[4]);
    const minuto = Number(matchBrDataHora[5]);

    if (!dataValida(ano, mes, dia) || !horaValida(hora, minuto)) {
      return null;
    }

    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`;
  }

  // Aceita padrao ISO local sem timezone (YYYY-MM-DDTHH:MM[:SS]) e preserva o horario.
  const matchIsoLocal = texto.match(REGEX_DATA_HORA_ISO_LOCAL);
  if (matchIsoLocal) {
    const ano = Number(matchIsoLocal[1]);
    const mes = Number(matchIsoLocal[2]);
    const dia = Number(matchIsoLocal[3]);
    const hora = Number(matchIsoLocal[4]);
    const minuto = Number(matchIsoLocal[5]);
    const segundo = Number(matchIsoLocal[6] ?? '0');

    if (!dataValida(ano, mes, dia) || !horaValida(hora, minuto) || segundo < 0 || segundo > 59) {
      return null;
    }

    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:${String(segundo).padStart(2, '0')}`;
  }

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const timezoneNegocio = obterTimezoneNegocio();

  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezoneNegocio,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(data);

  const ano = partes.find((parte) => parte.type === 'year')?.value;
  const mes = partes.find((parte) => parte.type === 'month')?.value;
  const dia = partes.find((parte) => parte.type === 'day')?.value;
  const hora = partes.find((parte) => parte.type === 'hour')?.value;
  const minuto = partes.find((parte) => parte.type === 'minute')?.value;
  const segundo = partes.find((parte) => parte.type === 'second')?.value;

  if (!ano || !mes || !dia || !hora || !minuto || !segundo) {
    return null;
  }

  return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
}

export function normalizarDataIso(valor: string): string | null {
  const texto = valor.trim();
  if (!texto) {
    return null;
  }

  // Aceita formato brasileiro DD-MM-YYYY.
  const matchBrData = texto.match(REGEX_DATA_BR);
  if (matchBrData) {
    const dia = Number(matchBrData[1]);
    const mes = Number(matchBrData[2]);
    const ano = Number(matchBrData[3]);

    if (!dataValida(ano, mes, dia)) {
      return null;
    }

    return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  }

  // Mantem formato legado AAAA-MM-DD apenas para compatibilidade retroativa.
  if (REGEX_DATA_ISO.test(texto)) {
    const partes = texto.split('-').map(Number);
    const ano = partes[0] ?? 0;
    const mes = partes[1] ?? 0;
    const dia = partes[2] ?? 0;
    if (!dataValida(ano, mes, dia)) {
      return null;
    }

    return texto;
  }

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data.toISOString().slice(0, 10);
}

export function formatarDataSaidaBr(valor: unknown, incluirHora = false): string {
  if (!valor) {
    return '';
  }

  // Timestamp sem timezone pode chegar como Date; preserva componentes sem reconverter fuso.
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return String(valor);
    }

    // `timestamp without time zone` do Postgres chega como Date no fuso local da conexao.
    // Usa getters locais para preservar o horario de parede salvo no banco.
    const ano = String(valor.getFullYear());
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');

    if (!incluirHora) {
      return `${dia}-${mes}-${ano}`;
    }

    const hora = String(valor.getHours()).padStart(2, '0');
    const minuto = String(valor.getMinutes()).padStart(2, '0');
    return `${dia}-${mes}-${ano} ${hora}:${minuto}`;
  }

  const texto = String(valor).trim();
  if (!texto) {
    return '';
  }

  // Quando o valor ja representa horario local sem timezone, evita nova conversao de fuso.
  const matchIsoLocal = texto.match(REGEX_DATA_HORA_ISO_LOCAL);
  if (matchIsoLocal) {
    const ano = matchIsoLocal[1];
    const mes = matchIsoLocal[2];
    const dia = matchIsoLocal[3];
    const hora = matchIsoLocal[4];
    const minuto = matchIsoLocal[5];

    if (incluirHora) {
      return `${dia}-${mes}-${ano} ${hora}:${minuto}`;
    }

    return `${dia}-${mes}-${ano}`;
  }

  // Alguns drivers retornam timestamp sem timezone com sufixo Z/offset.
  // Nesses casos, preserva horario de parede para evitar deslocamento indevido.
  const matchIsoComTz = texto.match(REGEX_DATA_HORA_ISO_COM_TZ);
  if (matchIsoComTz) {
    const ano = matchIsoComTz[1];
    const mes = matchIsoComTz[2];
    const dia = matchIsoComTz[3];
    const hora = matchIsoComTz[4];
    const minuto = matchIsoComTz[5];

    if (incluirHora) {
      return `${dia}-${mes}-${ano} ${hora}:${minuto}`;
    }

    return `${dia}-${mes}-${ano}`;
  }

  const matchDataIso = texto.match(REGEX_DATA_ISO);
  if (matchDataIso) {
    const ano = matchDataIso[1];
    const mes = matchDataIso[2];
    const dia = matchDataIso[3];
    return `${dia}-${mes}-${ano}`;
  }

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) {
    return String(valor);
  }

  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: obterTimezoneNegocio(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(incluirHora
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }
      : {}),
  }).formatToParts(data);

  const ano = partes.find((parte) => parte.type === 'year')?.value;
  const mes = partes.find((parte) => parte.type === 'month')?.value;
  const dia = partes.find((parte) => parte.type === 'day')?.value;

  if (!ano || !mes || !dia) {
    return String(valor);
  }

  if (!incluirHora) {
    return `${dia}-${mes}-${ano}`;
  }

  const hora = partes.find((parte) => parte.type === 'hour')?.value;
  const minuto = partes.find((parte) => parte.type === 'minute')?.value;

  if (!hora || !minuto) {
    return `${dia}-${mes}-${ano}`;
  }

  return `${dia}-${mes}-${ano} ${hora}:${minuto}`;
}
