-- Adiciona campos de avaliação ao appointment
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS rating FLOAT NULL,
  ADD COLUMN IF NOT EXISTS rating_comment TEXT NULL;
