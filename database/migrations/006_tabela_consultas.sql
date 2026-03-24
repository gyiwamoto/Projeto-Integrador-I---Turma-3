-- Migracao 006: cria a tabela de consultas

DO $$
DECLARE
	paciente_id_type TEXT;
	usuario_id_type TEXT;
BEGIN
	SELECT format_type(a.atttypid, a.atttypmod)
	INTO paciente_id_type
	FROM pg_attribute a
	WHERE a.attrelid = 'pacientes'::regclass
	  AND a.attname = 'id'
	  AND a.attnum > 0
	  AND NOT a.attisdropped;

	SELECT format_type(a.atttypid, a.atttypmod)
	INTO usuario_id_type
	FROM pg_attribute a
	WHERE a.attrelid = 'usuarios'::regclass
	  AND a.attname = 'id'
	  AND a.attnum > 0
	  AND NOT a.attisdropped;

	IF paciente_id_type IS NULL THEN
		paciente_id_type := 'uuid';
	END IF;

	IF usuario_id_type IS NULL THEN
		usuario_id_type := 'uuid';
	END IF;

	EXECUTE format(
		'CREATE TABLE IF NOT EXISTS consultas (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			paciente_id %s NOT NULL,
			usuario_id %s NOT NULL,
			data_consulta TIMESTAMPTZ NOT NULL,
			status VARCHAR(20) NOT NULL CHECK (status IN (''agendado'', ''realizado'', ''cancelado'')),
			convenio_id UUID,
			numero_carteirinha VARCHAR(60),
			observacoes TEXT,
			criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)',
		paciente_id_type,
		usuario_id_type
	);
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_consultas_pacientes'
	) THEN
		ALTER TABLE consultas
			ADD CONSTRAINT fk_consultas_pacientes
			FOREIGN KEY (paciente_id)
			REFERENCES pacientes (id)
			ON UPDATE CASCADE
			ON DELETE RESTRICT;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_consultas_usuarios'
	) THEN
		ALTER TABLE consultas
			ADD CONSTRAINT fk_consultas_usuarios
			FOREIGN KEY (usuario_id)
			REFERENCES usuarios (id)
			ON UPDATE CASCADE
			ON DELETE RESTRICT;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_consultas_convenios'
	) THEN
		ALTER TABLE consultas
			ADD CONSTRAINT fk_consultas_convenios
			FOREIGN KEY (convenio_id)
			REFERENCES convenios (id)
			ON UPDATE CASCADE
			ON DELETE SET NULL;
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultas_paciente_id ON consultas (paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_usuario_id ON consultas (usuario_id);
CREATE INDEX IF NOT EXISTS idx_consultas_convenio_id ON consultas (convenio_id);
CREATE INDEX IF NOT EXISTS idx_consultas_data ON consultas (data_consulta);
