-- Migration 005: Agendamentos recorrentes + confirmação de presença
-- Adiciona recurrence_group_id e confirmed_at na tabela appointments

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS recurrence_group_id TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Índice para buscar todos os agendamentos de um grupo de recorrência
CREATE INDEX IF NOT EXISTS idx_appointments_recurrence_group
  ON appointments (tenant_id, recurrence_group_id)
  WHERE recurrence_group_id IS NOT NULL;
