-- Migracao 010: consolida CNPJ como identificador de convenios

ALTER TABLE convenios
ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);

DO $$
DECLARE
	tem_id BOOLEAN;
	tem_pacientes_convenio_id BOOLEAN;
	tem_consultas_convenio_id BOOLEAN;
	tem_convenios_pk_cnpj BOOLEAN;
BEGIN
	SELECT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'convenios'
		  AND column_name = 'id'
	) INTO tem_id;

	WITH faltantes AS (
		SELECT ctid, ('TMP' || LPAD(ROW_NUMBER() OVER (ORDER BY criado_em, nome)::TEXT, 15, '0')) AS cnpj_tmp
		FROM convenios
		WHERE cnpj IS NULL OR BTRIM(cnpj) = ''
	)
	UPDATE convenios c
	   SET cnpj = f.cnpj_tmp
	  FROM faltantes f
	 WHERE c.ctid = f.ctid;

	ALTER TABLE convenios
		ALTER COLUMN cnpj SET NOT NULL;

	ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS convenio_cnpj VARCHAR(18);
	ALTER TABLE consultas ADD COLUMN IF NOT EXISTS convenio_cnpj VARCHAR(18);

	SELECT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'pacientes'
		  AND column_name = 'convenio_id'
	) INTO tem_pacientes_convenio_id;

	IF tem_pacientes_convenio_id THEN
		ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS convenio_cnpj VARCHAR(18);

		IF tem_id THEN
			UPDATE pacientes p
			   SET convenio_cnpj = cv.cnpj
			  FROM convenios cv
			 WHERE p.convenio_id IS NOT NULL
			   AND p.convenio_id::TEXT = cv.id::TEXT;
		ELSE
			UPDATE pacientes
			   SET convenio_cnpj = convenio_id::TEXT
			 WHERE convenio_id IS NOT NULL
			   AND (convenio_cnpj IS NULL OR BTRIM(convenio_cnpj) = '');
		END IF;

		ALTER TABLE pacientes DROP COLUMN convenio_id;
	END IF;

	ALTER TABLE pacientes
		ALTER COLUMN convenio_cnpj TYPE VARCHAR(18)
		USING convenio_cnpj::VARCHAR(18);

	SELECT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'consultas'
		  AND column_name = 'convenio_id'
	) INTO tem_consultas_convenio_id;

	IF tem_consultas_convenio_id THEN
		ALTER TABLE consultas ADD COLUMN IF NOT EXISTS convenio_cnpj VARCHAR(18);

		IF tem_id THEN
			UPDATE consultas c
			   SET convenio_cnpj = cv.cnpj
			  FROM convenios cv
			 WHERE c.convenio_id IS NOT NULL
			   AND c.convenio_id::TEXT = cv.id::TEXT;
		ELSE
			UPDATE consultas
			   SET convenio_cnpj = convenio_id::TEXT
			 WHERE convenio_id IS NOT NULL
			   AND (convenio_cnpj IS NULL OR BTRIM(convenio_cnpj) = '');
		END IF;

		ALTER TABLE consultas DROP COLUMN convenio_id;
	END IF;

	ALTER TABLE consultas
		ALTER COLUMN convenio_cnpj TYPE VARCHAR(18)
		USING convenio_cnpj::VARCHAR(18);

	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_pacientes_convenios'
	) THEN
		ALTER TABLE pacientes DROP CONSTRAINT fk_pacientes_convenios;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'fk_consultas_convenios'
	) THEN
		ALTER TABLE consultas DROP CONSTRAINT fk_consultas_convenios;
	END IF;

	SELECT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'convenios_pkey'
		  AND conrelid = 'convenios'::regclass
		  AND pg_get_constraintdef(oid) ILIKE '%(cnpj)%'
	) INTO tem_convenios_pk_cnpj;

	IF NOT tem_convenios_pk_cnpj THEN
		IF EXISTS (
			SELECT 1
			FROM pg_constraint
			WHERE conname = 'convenios_pkey'
			  AND conrelid = 'convenios'::regclass
		) THEN
			ALTER TABLE convenios DROP CONSTRAINT convenios_pkey;
		END IF;

		ALTER TABLE convenios ADD CONSTRAINT convenios_pkey PRIMARY KEY (cnpj);
	END IF;

	ALTER TABLE pacientes
		ADD CONSTRAINT fk_pacientes_convenios
		FOREIGN KEY (convenio_cnpj)
		REFERENCES convenios (cnpj)
		ON UPDATE CASCADE
		ON DELETE SET NULL;

	ALTER TABLE consultas
		ADD CONSTRAINT fk_consultas_convenios
		FOREIGN KEY (convenio_cnpj)
		REFERENCES convenios (cnpj)
		ON UPDATE CASCADE
		ON DELETE SET NULL;

	IF tem_id THEN
		ALTER TABLE convenios DROP COLUMN IF EXISTS id;
	END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_convenios_cnpj ON convenios (cnpj);