-- Migracao 001: cria a tabela de usuarios para autenticacao inicial

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	nome VARCHAR(120) NOT NULL,
	email VARCHAR(160) NOT NULL UNIQUE,
	senha_hash TEXT NOT NULL,
	tipo_usuario VARCHAR(20) NOT NULL CHECK (tipo_usuario IN ('admin', 'dentista', 'recepcionista')),
	ativo BOOLEAN NOT NULL DEFAULT TRUE,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);
