-- Migracao 014: adiciona campo de lembrete enviado em consultas para controle de notificacoes
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS lembrete_enviado BOOLEAN NOT NULL DEFAULT FALSE;
  
  