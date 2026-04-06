import { unstable_cache } from 'next/cache'
import { prisma } from '@barberpro/database'

const SEC_1MIN = 60
const SEC_5MIN = 300

// Profile do usuário (cache curto pois pode mudar role/tenant)
export const getCachedProfile = unstable_cache(
  async (userId: string) => {
    return prisma.profile.findUnique({ where: { user_id: userId } })
  },
  ['profile'],
  { revalidate: SEC_1MIN, tags: ['profile'] }
)

// Barbeiros (mudam pouco)
export const getCachedBarbers = unstable_cache(
  async (tenantId: string) => {
    return prisma.barber.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { name: 'asc' },
    })
  },
  ['barbers'],
  { revalidate: SEC_5MIN, tags: ['barbers'] }
)

// Serviços (mudam pouco)
export const getCachedServices = unstable_cache(
  async (tenantId: string) => {
    return prisma.service.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { name: 'asc' },
    })
  },
  ['services'],
  { revalidate: SEC_5MIN, tags: ['services'] }
)

// Clientes (mudam moderadamente)
export const getCachedClients = unstable_cache(
  async (tenantId: string) => {
    return prisma.client.findMany({
      where: { tenant_id: tenantId, is_active: true },
      orderBy: { name: 'asc' },
    })
  },
  ['clients'],
  { revalidate: SEC_1MIN, tags: ['clients'] }
)

// Produtos disponíveis
export const getCachedProducts = unstable_cache(
  async (tenantId: string) => {
    return prisma.product.findMany({
      where: { tenant_id: tenantId, is_active: true, stock: { gt: 0 } },
      orderBy: { name: 'asc' },
    })
  },
  ['products'],
  { revalidate: SEC_1MIN, tags: ['products'] }
)

// Tenant (dados da barbearia)
export const getCachedTenant = unstable_cache(
  async (tenantId: string) => {
    return prisma.tenant.findUnique({ where: { id: tenantId } })
  },
  ['tenant'],
  { revalidate: SEC_5MIN, tags: ['tenant'] }
)
