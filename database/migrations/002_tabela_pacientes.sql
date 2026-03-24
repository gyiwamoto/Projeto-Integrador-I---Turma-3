-- Migracao 002: cria a tabela de pacientes

CREATE TABLE IF NOT EXISTS pacientes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	codigo_paciente VARCHAR(20) NOT NULL UNIQUE,
	nome VARCHAR(120) NOT NULL,
	data_nascimento DATE,
	telefone VARCHAR(30),
	whatsapp_push BOOLEAN NOT NULL DEFAULT FALSE,
	email VARCHAR(160) UNIQUE,
	convenio_id UUID,
	numero_carteirinha VARCHAR(60),
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Compatibilidade com bases antigas: garante colunas novas sem quebrar a migration.
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS codigo_paciente VARCHAR(20);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS telefone VARCHAR(30);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS whatsapp_push BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS email VARCHAR(160);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS convenio_id UUID;
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS numero_carteirinha VARCHAR(60);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'uq_pacientes_codigo_paciente'
	) THEN
		ALTER TABLE pacientes
			ADD CONSTRAINT uq_pacientes_codigo_paciente UNIQUE (codigo_paciente);
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'uq_pacientes_email'
	) THEN
		ALTER TABLE pacientes
			ADD CONSTRAINT uq_pacientes_email UNIQUE (email);
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_pacientes_convenio_id ON pacientes (convenio_id);
