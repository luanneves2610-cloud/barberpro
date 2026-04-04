-- ============================================================
-- MIGRATION 001: Habilitar RLS em todas as tabelas tenant-scoped
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Retorna o tenant_id do usuário autenticado
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM profiles
  WHERE user_id = auth.uid()::text
  LIMIT 1;
$$;

-- Retorna o role do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM profiles
  WHERE user_id = auth.uid()::text
  LIMIT 1;
$$;

-- ============================================================
-- HABILITAR RLS
-- ============================================================

ALTER TABLE tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_breaks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sales    ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: TENANTS
-- Cada usuário vê somente o seu próprio tenant
-- ============================================================

CREATE POLICY "tenants: usuário vê apenas seu tenant"
  ON tenants FOR SELECT
  USING (id = get_tenant_id());

CREATE POLICY "tenants: owner pode atualizar"
  ON tenants FOR UPDATE
  USING (id = get_tenant_id() AND get_user_role() = 'OWNER');

-- ============================================================
-- POLICIES: PROFILES
-- ============================================================

CREATE POLICY "profiles: isolamento por tenant"
  ON profiles FOR SELECT
  USING (tenant_id = get_tenant_id() OR user_id = auth.uid()::text);

CREATE POLICY "profiles: owner/attendant podem inserir"
  ON profiles FOR INSERT
  WITH CHECK (
    tenant_id = get_tenant_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

CREATE POLICY "profiles: owner pode atualizar"
  ON profiles FOR UPDATE
  USING (
    tenant_id = get_tenant_id()
    AND get_user_role() IN ('OWNER', 'SUPER_ADMIN')
  );

-- ============================================================
-- POLICIES: BARBERS
-- ============================================================

CREATE POLICY "barbers: isolamento por tenant"
  ON barbers FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "barbers: owner pode gerenciar"
  ON barbers FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: BARBER SCHEDULES
-- ============================================================

CREATE POLICY "barber_schedules: isolamento por tenant"
  ON barber_schedules FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "barber_schedules: owner pode gerenciar"
  ON barber_schedules FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: BARBER BREAKS
-- ============================================================

CREATE POLICY "barber_breaks: isolamento por tenant"
  ON barber_breaks FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "barber_breaks: equipe pode gerenciar"
  ON barber_breaks FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'ATTENDANT', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: SERVICES
-- ============================================================

CREATE POLICY "services: isolamento por tenant"
  ON services FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "services: owner pode gerenciar"
  ON services FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: CLIENTS
-- ============================================================

CREATE POLICY "clients: isolamento por tenant"
  ON clients FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "clients: equipe pode gerenciar"
  ON clients FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'ATTENDANT', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: APPOINTMENTS
-- ============================================================

CREATE POLICY "appointments: isolamento por tenant"
  ON appointments FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "appointments: equipe pode gerenciar"
  ON appointments FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'ATTENDANT', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: PRODUCTS
-- ============================================================

CREATE POLICY "products: isolamento por tenant"
  ON products FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "products: owner pode gerenciar"
  ON products FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: PRODUCT SALES
-- ============================================================

CREATE POLICY "product_sales: isolamento por tenant"
  ON product_sales FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "product_sales: equipe pode registrar"
  ON product_sales FOR INSERT
  WITH CHECK (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'ATTENDANT', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: TRANSACTIONS
-- ============================================================

CREATE POLICY "transactions: isolamento por tenant"
  ON transactions FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "transactions: owner e attendant podem gerenciar"
  ON transactions FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'ATTENDANT', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: EXPENSES
-- ============================================================

CREATE POLICY "expenses: isolamento por tenant"
  ON expenses FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "expenses: owner pode gerenciar"
  ON expenses FOR ALL
  USING (tenant_id = get_tenant_id() AND get_user_role() IN ('OWNER', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES: SUBSCRIPTIONS
-- ============================================================

CREATE POLICY "subscriptions: owner vê sua assinatura"
  ON subscriptions FOR SELECT
  USING (tenant_id = get_tenant_id());

-- Subscriptions são gerenciadas apenas pela service role (webhooks Mercado Pago)

-- ============================================================
-- POLICIES: NOTIFICATIONS
-- ============================================================

CREATE POLICY "notifications: isolamento por tenant"
  ON notifications FOR SELECT
  USING (tenant_id = get_tenant_id());

CREATE POLICY "notifications: usuário pode marcar como lida"
  ON notifications FOR UPDATE
  USING (tenant_id = get_tenant_id() AND (profile_id = (
    SELECT id FROM profiles WHERE user_id = auth.uid()::text LIMIT 1
  ) OR get_user_role() IN ('OWNER', 'SUPER_ADMIN')));

-- ============================================================
-- SERVICE ROLE BYPASS
-- O service role (usado na API Next.js com Prisma) bypassa RLS
-- automaticamente. As policies acima protegem acessos diretos
-- via Supabase client no frontend.
-- ============================================================
