-- Migracao 013: persistir datas em horario local do Brasil (America/Sao_Paulo)
-- Objetivo: armazenar valores como horario local (sem timezone) para facilitar auditoria direta no banco.

BEGIN;

-- usuarios
ALTER TABLE usuarios
  ALTER COLUMN criado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (criado_em AT TIME ZONE 'America/Sao_Paulo'),
  ALTER COLUMN atualizado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (atualizado_em AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE usuarios
  ALTER COLUMN criado_em SET DEFAULT timezone('America/Sao_Paulo', now()),
  ALTER COLUMN atualizado_em SET DEFAULT timezone('America/Sao_Paulo', now());

-- pacientes
ALTER TABLE pacientes
  ALTER COLUMN criado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (criado_em AT TIME ZONE 'America/Sao_Paulo'),
  ALTER COLUMN atualizado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (atualizado_em AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE pacientes
  ALTER COLUMN criado_em SET DEFAULT timezone('America/Sao_Paulo', now()),
  ALTER COLUMN atualizado_em SET DEFAULT timezone('America/Sao_Paulo', now());

-- convenios
ALTER TABLE convenios
  ALTER COLUMN criado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (criado_em AT TIME ZONE 'America/Sao_Paulo'),
  ALTER COLUMN atualizado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (atualizado_em AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE convenios
  ALTER COLUMN criado_em SET DEFAULT timezone('America/Sao_Paulo', now()),
  ALTER COLUMN atualizado_em SET DEFAULT timezone('America/Sao_Paulo', now());

-- consultas
ALTER TABLE consultas
  ALTER COLUMN data_consulta TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (data_consulta AT TIME ZONE 'America/Sao_Paulo'),
  ALTER COLUMN criado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (criado_em AT TIME ZONE 'America/Sao_Paulo'),
  ALTER COLUMN atualizado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (atualizado_em AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE consultas
  ALTER COLUMN criado_em SET DEFAULT timezone('America/Sao_Paulo', now()),
  ALTER COLUMN atualizado_em SET DEFAULT timezone('America/Sao_Paulo', now());

-- procedimentos_realizados
ALTER TABLE procedimentos_realizados
  ALTER COLUMN criado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (criado_em AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE procedimentos_realizados
  ALTER COLUMN criado_em SET DEFAULT timezone('America/Sao_Paulo', now());

-- logs_acessos
ALTER TABLE logs_acessos
  ALTER COLUMN criado_em TYPE TIMESTAMP WITHOUT TIME ZONE
    USING (criado_em AT TIME ZONE 'America/Sao_Paulo');

ALTER TABLE logs_acessos
  ALTER COLUMN criado_em SET DEFAULT timezone('America/Sao_Paulo', now());

COMMIT;
