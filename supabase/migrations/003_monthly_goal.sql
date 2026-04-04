-- Adiciona campo monthly_goal ao tenant (meta mensal de receita)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS monthly_goal DECIMAL(10,2) NULL;
