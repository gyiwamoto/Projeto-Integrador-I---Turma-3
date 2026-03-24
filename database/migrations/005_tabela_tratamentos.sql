-- Migracao 005: cria a tabela de tratamentos

CREATE TABLE IF NOT EXISTS tratamentos (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nome VARCHAR(120) NOT NULL,
	descricao TEXT,
	valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tratamentos_nome ON tratamentos (nome);
