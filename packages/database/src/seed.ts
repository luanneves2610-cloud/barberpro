/**
 * BarberPro — Seed de dados demo
 *
 * Uso:
 *   cd packages/database
 *   npm run db:seed
 *
 * Pré-requisito: ter um tenant/profile já criado via cadastro normal.
 * O seed insere dados de demonstração no tenant cujo slug é passado como argumento
 * (ou no primeiro tenant encontrado se nenhum for passado).
 *
 *   npm run db:seed -- --slug minha-barbearia
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pastDate(daysAgo: number, hour = 10, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d
}

function futureDate(daysAhead: number, hour = 10, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  d.setHours(hour, minute, 0, 0)
  return d
}

function dateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function timeStr(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const FIRST_NAMES = ['Lucas', 'Pedro', 'Rafael', 'Bruno', 'Carlos', 'Felipe', 'Gustavo', 'Thiago', 'Matheus', 'Diego']
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Alves']
const PHONE_PREFIX = ['11', '21', '31', '41', '51', '71', '85']

function randomName() {
  return `${FIRST_NAMES[randomBetween(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[randomBetween(0, LAST_NAMES.length - 1)]}`
}

function randomPhone() {
  const prefix = PHONE_PREFIX[randomBetween(0, PHONE_PREFIX.length - 1)]
  return `(${prefix}) 9${randomBetween(1000, 9999)}-${randomBetween(1000, 9999)}`
}

function randomBirthDate() {
  // Age between 18 and 60
  const year = new Date().getFullYear() - randomBetween(18, 60)
  const month = randomBetween(1, 12)
  const day = randomBetween(1, 28)
  return new Date(year, month - 1, day)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1]

  // Find tenant
  const tenant = await prisma.tenant.findFirst({
    where: slugArg ? { slug: slugArg } : undefined,
    orderBy: { created_at: 'asc' },
  })

  if (!tenant) {
    console.error('❌ Nenhum tenant encontrado. Crie uma conta antes de rodar o seed.')
    process.exit(1)
  }

  console.log(`\n🌱 Seedando dados demo para: ${tenant.name} (${tenant.slug})\n`)

  const tenantId = tenant.id

  // -------------------------------------------------------------------------
  // 1. Barbeiros
  // -------------------------------------------------------------------------
  console.log('👤 Criando barbeiros...')

  const barbersData = [
    { name: 'João Mendes', phone: '(11) 99111-0001', commission_pct: 40, bio: 'Especialista em degradê e barba.' },
    { name: 'Carlos Rocha', phone: '(11) 99111-0002', commission_pct: 35, bio: 'Cortes modernos e clássicos.' },
    { name: 'Rafael Lima', phone: '(11) 99111-0003', commission_pct: 30, bio: 'Especialista em coloração e química.' },
  ]

  const barbers = await Promise.all(
    barbersData.map((b) =>
      prisma.barber.upsert({
        where: { id: `seed-barber-${b.name.toLowerCase().replace(/\s/g, '-')}-${tenantId}` },
        update: {},
        create: {
          id: `seed-barber-${b.name.toLowerCase().replace(/\s/g, '-')}-${tenantId}`,
          tenant_id: tenantId,
          name: b.name,
          phone: b.phone,
          commission_pct: b.commission_pct,
          bio: b.bio,
          is_active: true,
        },
      }),
    ),
  )
  console.log(`   ✓ ${barbers.length} barbeiros criados`)

  // -------------------------------------------------------------------------
  // 2. Horários dos barbeiros (seg-sab, 09:00-19:00)
  // -------------------------------------------------------------------------
  console.log('📅 Configurando horários...')
  for (const barber of barbers) {
    for (let day = 1; day <= 6; day++) {
      await prisma.barberSchedule.upsert({
        where: { barber_id_day_of_week: { barber_id: barber.id, day_of_week: day } },
        update: {},
        create: {
          tenant_id: tenantId,
          barber_id: barber.id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '19:00',
          is_active: true,
        },
      })
    }
  }
  console.log('   ✓ Horários configurados')

  // -------------------------------------------------------------------------
  // 3. Serviços
  // -------------------------------------------------------------------------
  console.log('✂️  Criando serviços...')

  const servicesData = [
    { name: 'Corte Degradê', price: 45, duration: 45, icon: '✂️' },
    { name: 'Barba Completa', price: 35, duration: 30, icon: '🪒' },
    { name: 'Corte + Barba', price: 70, duration: 60, icon: '💈' },
    { name: 'Corte Simples', price: 30, duration: 30, icon: '✂️' },
    { name: 'Pigmentação', price: 50, duration: 45, icon: '🎨' },
    { name: 'Hidratação', price: 40, duration: 30, icon: '💧' },
    { name: 'Sobrancelha', price: 20, duration: 15, icon: '👁️' },
  ]

  const services = await Promise.all(
    servicesData.map((s) =>
      prisma.service.upsert({
        where: { id: `seed-service-${s.name.toLowerCase().replace(/\s/g, '-')}-${tenantId}` },
        update: {},
        create: {
          id: `seed-service-${s.name.toLowerCase().replace(/\s/g, '-')}-${tenantId}`,
          tenant_id: tenantId,
          name: s.name,
          price: s.price,
          duration: s.duration,
          icon: s.icon,
          is_active: true,
        },
      }),
    ),
  )
  console.log(`   ✓ ${services.length} serviços criados`)

  // -------------------------------------------------------------------------
  // 4. Produtos
  // -------------------------------------------------------------------------
  console.log('📦 Criando produtos...')

  const productsData = [
    { name: 'Pomada Modeladora Black', price: 35, cost: 18, stock: 25, min_stock: 5 },
    { name: 'Shampoo Antiqueda 300ml', price: 28, cost: 12, stock: 18, min_stock: 3 },
    { name: 'Óleo de Barba Premium', price: 42, cost: 20, stock: 10, min_stock: 3 },
    { name: 'Balm para Barba', price: 38, cost: 17, stock: 3, min_stock: 5 },
    { name: 'Lâmina de Barbear (cx10)', price: 22, cost: 10, stock: 0, min_stock: 5 },
    { name: 'Loção Pós-Barba', price: 30, cost: 14, stock: 8, min_stock: 3 },
  ]

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.upsert({
        where: { id: `seed-product-${p.name.toLowerCase().replace(/\s/g, '-').substring(0, 30)}-${tenantId}` },
        update: {},
        create: {
          id: `seed-product-${p.name.toLowerCase().replace(/\s/g, '-').substring(0, 30)}-${tenantId}`,
          tenant_id: tenantId,
          name: p.name,
          price: p.price,
          cost: p.cost,
          stock: p.stock,
          min_stock: p.min_stock,
          is_active: true,
        },
      }),
    ),
  )
  console.log(`   ✓ ${products.length} produtos criados`)

  // -------------------------------------------------------------------------
  // 5. Clientes (30 clientes)
  // -------------------------------------------------------------------------
  console.log('👥 Criando clientes...')

  const clientsCreated: { id: string; name: string }[] = []
  for (let i = 0; i < 30; i++) {
    const name = randomName()
    const client = await prisma.client.upsert({
      where: { id: `seed-client-${i}-${tenantId}` },
      update: {},
      create: {
        id: `seed-client-${i}-${tenantId}`,
        tenant_id: tenantId,
        name,
        phone: randomPhone(),
        email: `cliente${i}@demo.com.br`,
        birth_date: randomBirthDate(),
        is_active: true,
      },
    })
    clientsCreated.push({ id: client.id, name: client.name })
  }

  // Ensure 2 birthdays fall today (for demo purposes)
  const today = new Date()
  for (let i = 0; i < 2; i++) {
    const birthdayDate = new Date(1990 + i, today.getMonth(), today.getDate())
    await prisma.client.update({
      where: { id: clientsCreated[i].id },
      data: { birth_date: birthdayDate },
    })
  }

  console.log(`   ✓ ${clientsCreated.length} clientes criados (2 fazem aniversário hoje)`)

  // -------------------------------------------------------------------------
  // 6. Agendamentos (histórico 60 dias + próximos 7 dias)
  // -------------------------------------------------------------------------
  console.log('📆 Criando agendamentos...')

  const paymentMethods = ['PIX', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD']
  let appointmentCount = 0
  let transactionCount = 0

  // Past appointments (last 60 days) — COMPLETED
  for (let daysAgo = 1; daysAgo <= 60; daysAgo++) {
    const apptPerDay = randomBetween(2, 6)
    let currentHour = 9

    for (let j = 0; j < apptPerDay; j++) {
      const barber = barbers[j % barbers.length]
      const service = services[randomBetween(0, services.length - 1)]
      const client = clientsCreated[randomBetween(0, clientsCreated.length - 1)]
      const date = dateOnly(pastDate(daysAgo))
      const startTime = timeStr(currentHour, 0)
      const durationH = Math.floor(Number(service.duration) / 60)
      const durationM = Number(service.duration) % 60
      const endHour = currentHour + durationH + (durationM > 0 ? 1 : 0)
      const endTime = timeStr(endHour, durationM)
      currentHour = endHour + 1
      if (currentHour > 18) break

      const price = Number(service.price) * (1 - (randomBetween(0, 2) * 5) / 100) // 0-10% discount
      const payment = paymentMethods[randomBetween(0, paymentMethods.length - 1)]
      const apptId = `seed-appt-${daysAgo}-${j}-${tenantId}`

      await prisma.appointment.upsert({
        where: { id: apptId },
        update: {},
        create: {
          id: apptId,
          tenant_id: tenantId,
          client_id: client.id,
          barber_id: barber.id,
          service_id: service.id,
          date,
          start_time: startTime,
          end_time: endTime,
          price,
          status: 'COMPLETED',
          payment_method: payment,
        },
      })

      // Transaction for completed appointment
      const txId = `seed-tx-appt-${daysAgo}-${j}-${tenantId}`
      await prisma.transaction.upsert({
        where: { id: txId },
        update: {},
        create: {
          id: txId,
          tenant_id: tenantId,
          type: 'INCOME',
          category: 'SERVICO',
          description: `${service.name} — ${client.name}`,
          amount: price,
          date,
          payment_method: payment,
        },
      })

      appointmentCount++
      transactionCount++
    }
  }

  // Future appointments (next 7 days) — SCHEDULED
  const futureSlots = [
    [9, 0], [10, 0], [11, 0], [14, 0], [15, 0], [16, 0],
  ]

  for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
    const apptPerDay = randomBetween(1, 4)
    for (let j = 0; j < apptPerDay; j++) {
      const barber = barbers[j % barbers.length]
      const service = services[randomBetween(0, services.length - 1)]
      const client = clientsCreated[randomBetween(0, clientsCreated.length - 1)]
      const date = dateOnly(futureDate(daysAhead))
      const slot = futureSlots[j % futureSlots.length]
      const startTime = timeStr(slot[0], slot[1])
      const endMinutes = slot[1] + Number(service.duration)
      const endTime = timeStr(slot[0] + Math.floor(endMinutes / 60), endMinutes % 60)
      const apptId = `seed-appt-future-${daysAhead}-${j}-${tenantId}`

      await prisma.appointment.upsert({
        where: { id: apptId },
        update: {},
        create: {
          id: apptId,
          tenant_id: tenantId,
          client_id: client.id,
          barber_id: barber.id,
          service_id: service.id,
          date,
          start_time: startTime,
          end_time: endTime,
          price: Number(service.price),
          status: 'SCHEDULED',
        },
      })
      appointmentCount++
    }
  }

  console.log(`   ✓ ${appointmentCount} agendamentos criados`)

  // -------------------------------------------------------------------------
  // 7. Despesas (últimos 60 dias)
  // -------------------------------------------------------------------------
  console.log('💸 Criando despesas...')

  const expenseCategories = [
    { category: 'ALUGUEL', description: 'Aluguel da barbearia', amount: 2500, monthly: true },
    { category: 'AGUA_LUZ', description: 'Conta de luz', amount: 380, monthly: true },
    { category: 'INSUMOS', description: 'Compra de produtos para revenda', amount: 650, monthly: false },
    { category: 'INSUMOS', description: 'Material de consumo (toalhas, capas)', amount: 180, monthly: false },
    { category: 'MARKETING', description: 'Anúncio Instagram', amount: 200, monthly: true },
    { category: 'OUTROS', description: 'Manutenção de equipamentos', amount: 320, monthly: false },
  ]

  let expenseCount = 0
  for (let month = 0; month < 2; month++) {
    const baseDate = new Date(now.getFullYear(), now.getMonth() - month, 5)
    for (let i = 0; i < expenseCategories.length; i++) {
      const exp = expenseCategories[i]
      if (!exp.monthly && month > 0 && randomBetween(0, 1) === 0) continue

      const expId = `seed-expense-${month}-${i}-${tenantId}`
      const expDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), randomBetween(3, 25))

      await prisma.transaction.upsert({
        where: { id: expId },
        update: {},
        create: {
          id: expId,
          tenant_id: tenantId,
          type: 'EXPENSE',
          category: exp.category,
          description: exp.description,
          amount: exp.amount,
          date: expDate,
          payment_method: 'PIX',
        },
      })
      transactionCount++
      expenseCount++
    }
  }

  console.log(`   ✓ ${expenseCount} despesas criadas`)
  console.log(`   ✓ ${transactionCount} transações no total`)

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n✅ Seed concluído com sucesso!')
  console.log(`
  Tenant:       ${tenant.name} (${tenant.slug})
  Barbeiros:    ${barbers.length}
  Serviços:     ${services.length}
  Produtos:     ${products.length}
  Clientes:     ${clientsCreated.length}
  Agendamentos: ${appointmentCount}
  Transações:   ${transactionCount}
  `)
}

main()
  .catch((err) => {
    console.error('❌ Erro no seed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
