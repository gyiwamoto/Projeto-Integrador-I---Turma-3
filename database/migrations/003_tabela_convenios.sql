-- Migracao 003: cria a tabela de convenios

CREATE TABLE IF NOT EXISTS convenios (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nome VARCHAR(120) NOT NULL UNIQUE,
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_convenios_nome ON convenios (nome);
CREATE INDEX IF NOT EXISTS idx_convenios_ativo ON convenios (ativo);
