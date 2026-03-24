-- Migracao 007: cria a tabela de procedimentos realizados

CREATE TABLE IF NOT EXISTS procedimentos_realizados (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	consulta_id UUID NOT NULL,
	tratamento_id UUID NOT NULL,
	dente SMALLINT,
	face VARCHAR(2),
	data_procedimento DATE NOT NULL,
	observacoes TEXT,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT fk_procedimentos_consultas
		FOREIGN KEY (consulta_id)
		REFERENCES consultas (id)
		ON UPDATE CASCADE
		ON DELETE CASCADE,
	CONSTRAINT fk_procedimentos_tratamentos
		FOREIGN KEY (tratamento_id)
		REFERENCES tratamentos (id)
		ON UPDATE CASCADE
		ON DELETE RESTRICT,
	CONSTRAINT ck_procedimentos_face
		CHECK (face IS NULL OR face IN ('M', 'D', 'V', 'L', 'P', 'O', 'I'))
);

CREATE INDEX IF NOT EXISTS idx_procedimentos_consulta_id ON procedimentos_realizados (consulta_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_tratamento_id ON procedimentos_realizados (tratamento_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_data ON procedimentos_realizados (data_procedimento);
