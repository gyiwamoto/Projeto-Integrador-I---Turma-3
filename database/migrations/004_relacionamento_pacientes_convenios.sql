-- Migracao 004: adiciona relacionamento entre pacientes e convenios

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_pacientes_convenios'
	) THEN
		ALTER TABLE pacientes
			ADD CONSTRAINT fk_pacientes_convenios
			FOREIGN KEY (convenio_id)
			REFERENCES convenios (id)
			ON UPDATE CASCADE
			ON DELETE SET NULL;
	END IF;
END $$;
