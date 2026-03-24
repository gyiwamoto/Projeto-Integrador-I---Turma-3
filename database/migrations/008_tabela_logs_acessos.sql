-- Migracao 008: cria a tabela de logs de acessos

CREATE TABLE IF NOT EXISTS logs_acessos (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	usuario_id UUID,
	email_informado VARCHAR(160),
	ip_origem INET,
	user_agent TEXT,
	rota VARCHAR(255) NOT NULL,
	metodo_http VARCHAR(10) NOT NULL,
	status_http INTEGER NOT NULL,
	sucesso BOOLEAN NOT NULL DEFAULT FALSE,
	mensagem TEXT,
	criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CONSTRAINT fk_logs_acessos_usuarios
		FOREIGN KEY (usuario_id)
		REFERENCES usuarios (id)
		ON UPDATE CASCADE
		ON DELETE SET NULL,
	CONSTRAINT ck_logs_acessos_status_http
		CHECK (status_http >= 100 AND status_http <= 599)
);

CREATE INDEX IF NOT EXISTS idx_logs_acessos_usuario_id ON logs_acessos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_acessos_criado_em ON logs_acessos (criado_em);
CREATE INDEX IF NOT EXISTS idx_logs_acessos_rota ON logs_acessos (rota);
