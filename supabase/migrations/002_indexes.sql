-- ============================================================
-- MIGRATION 002: Índices de performance para queries multi-tenant
-- Execute após 001_enable_rls.sql
-- ============================================================

-- Appointments: queries mais comuns
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date
  ON appointments(tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_barber_date
  ON appointments(tenant_id, barber_id, date);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_status
  ON appointments(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_client
  ON appointments(tenant_id, client_id);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_tenant_phone
  ON clients(tenant_id, phone);

CREATE INDEX IF NOT EXISTS idx_clients_tenant_name
  ON clients(tenant_id, name);

-- Transactions: relatórios financeiros por período
CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date
  ON transactions(tenant_id, date);

CREATE INDEX IF NOT EXISTS idx_transactions_tenant_type_date
  ON transactions(tenant_id, type, date);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date
  ON expenses(tenant_id, date);

-- Notifications: não lidas por usuário
CREATE INDEX IF NOT EXISTS idx_notifications_profile_unread
  ON notifications(profile_id, is_read) WHERE is_read = false;

-- Profiles: lookup por user_id (autenticação)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id
  ON profiles(user_id);

-- Product sales: relatórios
CREATE INDEX IF NOT EXISTS idx_product_sales_tenant_date
  ON product_sales(tenant_id, sold_at);
