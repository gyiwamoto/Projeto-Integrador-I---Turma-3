-- Migracao 011: remove tabela de tratamentos e adapta procedimentos para codigo fixo

ALTER TABLE IF EXISTS procedimentos_realizados
  DROP CONSTRAINT IF EXISTS fk_procedimentos_tratamentos;

ALTER TABLE IF EXISTS procedimentos_realizados
  ALTER COLUMN tratamento_id TYPE TEXT
  USING tratamento_id::text;

ALTER TABLE IF EXISTS procedimentos_realizados
  ALTER COLUMN tratamento_id SET NOT NULL;

DROP TABLE IF EXISTS tratamentos;
