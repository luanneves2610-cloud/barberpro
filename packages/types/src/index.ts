// ============================================================
// ENUMS
// ============================================================

export type Plan = 'BASIC' | 'PRO' | 'ENTERPRISE'
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
export type Role = 'SUPER_ADMIN' | 'OWNER' | 'ATTENDANT' | 'BARBER' | 'CLIENT'
export type AppointmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type PaymentMethod = 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD'
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED'
export type TransactionType = 'INCOME' | 'EXPENSE'
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED'
export type NotificationType =
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'SYSTEM'

// ============================================================
// ENTITIES
// ============================================================

export interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  plan: Plan
  status: TenantStatus
  monthly_goal?: number | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  tenant_id: string
  user_id: string
  role: Role
  name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Barber {
  id: string
  tenant_id: string
  name: string
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  bio?: string | null
  commission_pct: number
  rating: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BarberSchedule {
  id: string
  tenant_id: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface BarberBreak {
  id: string
  tenant_id: string
  barber_id: string
  date: string
  start_time: string
  end_time: string
  reason?: string | null
}

export interface Service {
  id: string
  tenant_id: string
  name: string
  description?: string | null
  duration: number
  price: number
  icon?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  tenant_id: string
  user_id?: string | null
  name: string
  email?: string | null
  phone?: string | null
  birth_date?: string | null
  avatar_url?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  tenant_id: string
  client_id: string
  barber_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  payment_method?: PaymentMethod | null
  payment_status: PaymentStatus
  price: number
  notes?: string | null
  rating?: number | null
  rating_comment?: string | null
  recurrence_group_id?: string | null
  confirmed_at?: string | null
  created_at: string
  updated_at: string
  // relations (optional)
  client?: Client
  barber?: Barber
  service?: Service
}

export interface Product {
  id: string
  tenant_id: string
  name: string
  category?: string | null
  description?: string | null
  price: number
  cost?: number | null
  stock: number
  min_stock: number
  image_url?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductSale {
  id: string
  tenant_id: string
  appointment_id?: string | null
  product_id: string
  quantity: number
  unit_price: number
  total: number
  sold_at: string
}

export interface Transaction {
  id: string
  tenant_id: string
  appointment_id?: string | null
  type: TransactionType
  category?: string | null
  description?: string | null
  amount: number
  payment_method?: PaymentMethod | null
  date: string
  created_at: string
}

export interface Expense {
  id: string
  tenant_id: string
  category: string
  description: string
  amount: number
  date: string
  created_at: string
}

export interface Subscription {
  id: string
  tenant_id: string
  plan: Plan
  status: SubscriptionStatus
  price: number
  billing_cycle: string
  started_at: string
  ends_at?: string | null
  trial_ends_at?: string | null
  mercadopago_id?: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  tenant_id: string
  profile_id?: string | null
  title: string
  body: string
  type: NotificationType
  is_read: boolean
  data?: Record<string, unknown> | null
  created_at: string
}

// ============================================================
// PLAN CONFIG
// ============================================================

export const PLAN_CONFIG: Record<Plan, { name: string; price: number; maxBarbers: number | null; maxAppointmentsPerMonth: number | null; features: string[] }> = {
  BASIC: {
    name: 'Básico',
    price: 97,
    maxBarbers: 2,
    maxAppointmentsPerMonth: 200,
    features: ['2 barbeiros', '200 agendamentos/mês', 'Acesso ao app cliente', 'Relatórios básicos'],
  },
  PRO: {
    name: 'Pro',
    price: 197,
    maxBarbers: null,
    maxAppointmentsPerMonth: 1000,
    features: ['Barbeiros ilimitados', '1.000 agendamentos/mês', 'WhatsApp automático', 'Financeiro completo', 'Gestão de produtos'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 397,
    maxBarbers: null,
    maxAppointmentsPerMonth: null,
    features: ['Agendamentos ilimitados', 'Relatórios avançados', 'NF-e automática', 'Suporte prioritário', 'API access'],
  },
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================================
// AUTH TYPES
// ============================================================

export interface RegisterTenantPayload {
  tenantName: string
  slug: string
  ownerName: string
  email: string
  password: string
  phone?: string
  plan?: Plan
}

export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile
  tenant: Tenant
}

// ============================================================
// DASHBOARD TYPES
// ============================================================

export interface DashboardMetrics {
  today: {
    total: number
    completed: number
    inProgress: number
    cancelled: number
    revenue: number
  }
  month: {
    revenue: number
    appointments: number
    newClients: number
    avgTicket: number
  }
}
