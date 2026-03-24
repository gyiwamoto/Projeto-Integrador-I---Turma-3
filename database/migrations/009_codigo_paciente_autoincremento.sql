-- Migracao 009: gera codigo_paciente automatico no formato P00001

CREATE SEQUENCE IF NOT EXISTS pacientes_codigo_seq START WITH 1 INCREMENT BY 1;

DO $$
DECLARE
	maior_codigo BIGINT;
BEGIN
	SELECT COALESCE(MAX((regexp_match(codigo_paciente, '^P([0-9]+)$'))[1]::BIGINT), 0)
	INTO maior_codigo
	FROM pacientes
	WHERE codigo_paciente ~ '^P[0-9]+$';

	PERFORM setval('pacientes_codigo_seq', maior_codigo + 1, false);
END $$;

ALTER TABLE pacientes
	ALTER COLUMN codigo_paciente SET DEFAULT ('P' || LPAD(nextval('pacientes_codigo_seq')::TEXT, 5, '0'));

UPDATE pacientes
SET codigo_paciente = 'P' || LPAD(nextval('pacientes_codigo_seq')::TEXT, 5, '0')
WHERE codigo_paciente IS NULL OR BTRIM(codigo_paciente) = '';
