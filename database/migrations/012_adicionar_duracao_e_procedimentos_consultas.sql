-- Migracao 012: adiciona metadados de procedimento e duracao estimada nas consultas

ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS procedimentos_agendados TEXT[];

ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS duracao_estimada_min INTEGER;

UPDATE consultas
SET procedimentos_agendados = ARRAY['100']::TEXT[]
WHERE procedimentos_agendados IS NULL OR array_length(procedimentos_agendados, 1) IS NULL;

UPDATE consultas
SET duracao_estimada_min = 30
WHERE duracao_estimada_min IS NULL OR duracao_estimada_min <= 0;

ALTER TABLE consultas
  ALTER COLUMN procedimentos_agendados SET DEFAULT ARRAY['100']::TEXT[];

ALTER TABLE consultas
  ALTER COLUMN procedimentos_agendados SET NOT NULL;

ALTER TABLE consultas
  ALTER COLUMN duracao_estimada_min SET DEFAULT 30;

ALTER TABLE consultas
  ALTER COLUMN duracao_estimada_min SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_consultas_duracao_estimada_min_15'
  ) THEN
    ALTER TABLE consultas
      ADD CONSTRAINT ck_consultas_duracao_estimada_min_15
      CHECK (duracao_estimada_min > 0 AND duracao_estimada_min % 15 = 0);
  END IF;
END $$;
