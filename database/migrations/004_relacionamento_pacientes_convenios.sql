-- Migracao 004: adiciona relacionamento entre pacientes e convenios

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_pacientes_convenios'
	) THEN
		ALTER TABLE pacientes
			ALTER COLUMN convenio_cnpj TYPE VARCHAR(18)
			USING convenio_cnpj::VARCHAR(18);

		ALTER TABLE pacientes
			ADD CONSTRAINT fk_pacientes_convenios
			FOREIGN KEY (convenio_cnpj)
			REFERENCES convenios (cnpj)
			ON UPDATE CASCADE
			ON DELETE SET NULL;
	END IF;
END $$;
