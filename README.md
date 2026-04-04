# BarberPro — SaaS de Gestão para Barbearias

Sistema multi-tenant completo para barbearias: agendamentos, financeiro, comissões, marketing via WhatsApp, assinaturas e muito mais.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend / Backend | Next.js 14 (App Router, Server Actions) |
| Banco de dados | PostgreSQL via Supabase |
| ORM | Prisma |
| Autenticação | Supabase Auth (SSR) |
| Monorepo | Turborepo + npm workspaces |
| Filas assíncronas | BullMQ + Redis |
| Pagamentos | Mercado Pago Checkout Pro |
| WhatsApp | Evolution API |
| NF-e | Focus NFe |
| Deploy | Docker (standalone) |

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker & Docker Compose (para produção)
- Conta no [Supabase](https://supabase.com) (gratuito)
- Redis 7+ (local ou Upstash)

---

## Início rápido (desenvolvimento local)

```bash
# 1. Clonar e instalar dependências
git clone <repo>
cd barberpro
npm install

# 2. Configurar variáveis de ambiente
cp apps/web/.env.example apps/web/.env.local
# Edite .env.local com suas credenciais (ver seção abaixo)

# 3. Gerar o Prisma client
npm run db:generate

# 4. Rodar as migrations no banco
npx prisma db push --schema=packages/database/prisma/schema.prisma

# 5. (Opcional) Popular com dados de demonstração
npm run db:seed -- --slug=minha-barbearia

# 6. Iniciar o servidor de desenvolvimento
npm run dev

# 7. (Opcional) Iniciar os workers BullMQ em outro terminal
npx tsx apps/web/lib/queue/workers.ts
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Variáveis de ambiente

Copie `apps/web/.env.example` para `apps/web/.env.local` e preencha:

### Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (nunca exponha no cliente) |
| `DATABASE_URL` | Connection string do Supabase (modo pool — porta 6543) |
| `DIRECT_URL` | Connection string direta do Supabase (porta 5432, para migrations) |

### Opcionais (features desativadas se ausentes)

| Variável | Descrição | Feature |
|----------|-----------|---------|
| `NEXT_PUBLIC_APP_URL` | URL pública do app (ex: `https://app.barberpro.com.br`) | Links de confirmação/avaliação no WhatsApp |
| `REDIS_URL` | URL do Redis (padrão: `redis://localhost:6379`) | Filas BullMQ, rate limiting |
| `EVOLUTION_API_URL` | URL da sua instância Evolution API | WhatsApp |
| `EVOLUTION_API_KEY` | API key da Evolution API | WhatsApp |
| `EVOLUTION_INSTANCE` | Nome da instância Evolution API | WhatsApp |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acesso do Mercado Pago | Pagamentos / Assinaturas |
| `MERCADOPAGO_WEBHOOK_SECRET` | Secret para validar webhooks do MP | Webhooks de pagamento |
| `FOCUS_NFE_TOKEN` | Token da API Focus NFe | Emissão de NF-e |
| `FOCUS_NFE_ENV` | `homologacao` ou `producao` | NF-e |

---

## Banco de dados

### Criar as tabelas

```bash
# Aplica o schema Prisma diretamente (desenvolvimento)
npx prisma db push --schema=packages/database/prisma/schema.prisma

# OU executa as migrations SQL manualmente no Supabase SQL Editor:
# supabase/migrations/001_enable_rls.sql
# supabase/migrations/002_indexes.sql
# supabase/migrations/003_monthly_goal.sql
# supabase/migrations/004_appointment_rating.sql
# supabase/migrations/005_appointment_recurrence_confirmation.sql
```

### Seed de dados (opcional)

```bash
# Cria uma barbearia demo completa (3 barbeiros, 7 serviços, 30 clientes, agendamentos)
npm run db:seed -- --slug=demo
```

---

## Deploy com Docker

### Build e execução

```bash
# Copiar e editar variáveis de produção
cp apps/web/.env.example .env.production
# Edite .env.production com seus valores reais

# Subir todos os serviços (web + workers + redis)
docker-compose up -d --build

# Verificar logs
docker-compose logs -f web
docker-compose logs -f workers
```

### Serviços no docker-compose.yml

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| `web` | 3000 | Aplicação Next.js |
| `workers` | — | Workers BullMQ (lembretes, blast, NFe, aniversário, reengajamento) |
| `redis` | 6379 | Redis (filas e rate limiting) |

---

## Health Check

```
GET /api/health
```

Resposta (200 OK):
```json
{
  "status": "ok",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "timestamp": "2026-04-04T12:00:00.000Z",
  "totalLatencyMs": 12,
  "services": {
    "database": { "status": "ok", "latencyMs": 8 },
    "cache": { "status": "ok", "latencyMs": 2 }
  }
}
```

Status possíveis: `ok` (200), `degraded` (200), `down` (503).

---

## Rate Limiting

Rotas são protegidas por rate limiting via Redis (fail-open: se Redis offline, a rota continua funcionando):

| Rota | Limite | Janela |
|------|--------|--------|
| `POST /api/rating` | 5 requisições / IP | 60 segundos |
| `POST /api/upload` | 20 uploads / usuário | 1 hora |
| `POST /api/webhooks/mercadopago` | 60 requisições / IP | 60 segundos |
| `GET /api/export/*` | 30 exports / usuário | 10 minutos |

Respostas incluem headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Autenticação — Fluxos completos

### Login / Registro
- `POST /login` → Supabase `signInWithPassword`
- `POST /register` → cria tenant + profile + subscription trial

### Recuperação de senha
```
1. /forgot-password → requestPasswordReset(email)
2. Supabase envia e-mail → link aponta para /api/auth/callback?code=xxx&next=/reset-password
3. /api/auth/callback → exchangeCodeForSession → redirect para /reset-password
4. /reset-password → updatePassword(newPassword) → redirect para /dashboard
```

### Variável de ambiente obrigatória para e-mails de recuperação
```
NEXT_PUBLIC_APP_URL=https://seudominio.com
```
Configure também no Supabase Dashboard → Authentication → URL Configuration → Site URL.

---

## Workers BullMQ

Os workers rodam em processo separado e precisam ser iniciados independentemente:

```bash
# Desenvolvimento
npx tsx apps/web/lib/queue/workers.ts

# Produção (PM2)
pm2 start apps/web/lib/queue/workers.ts --interpreter tsx --name barberpro-workers

# Com Docker (já incluído no docker-compose.yml)
docker-compose up workers -d
```

### Cron jobs automáticos

| Job | Schedule | Descrição |
|-----|----------|-----------|
| Birthday | `0 9 * * *` | WhatsApp de aniversário para clientes |
| Reengajamento | `0 10 * * 1` | WhatsApp para clientes inativos (30+ dias) |

---

## Estrutura do monorepo

```
barberpro/
├── apps/
│   └── web/                    # Next.js 14 — painel web + API
│       ├── app/                # App Router (páginas e rotas)
│       ├── components/         # Componentes React
│       └── lib/                # Actions, utils, integrações
├── packages/
│   ├── database/               # Prisma schema + client singleton
│   ├── types/                  # Tipos TypeScript compartilhados
│   └── ui/                     # Componentes UI (Button, Input, Avatar...)
├── supabase/
│   └── migrations/             # SQL de RLS, índices e alterações
├── docker-compose.yml
└── README.md
```

---

## Planos e limites

| Plano | Preço | Barbeiros | Agendamentos/mês |
|-------|-------|-----------|-----------------|
| BASIC | R$97 | 2 | 200 |
| PRO | R$197 | Ilimitado | Ilimitado |
| ENTERPRISE | R$397 | Ilimitado | Ilimitado + NF-e automática |

---

## Rotas públicas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page de marketing |
| `/login` | Login |
| `/register` | Cadastro de novo tenant |
| `/forgot-password` | Solicitar recuperação de senha |
| `/reset-password` | Redefinir senha (após link por e-mail) |
| `/api/auth/callback` | Callback PKCE do Supabase (confirmação de e-mail / recuperação de senha) |
| `/agendar/[slug]` | Agendamento online público da barbearia |
| `/avaliar/[id]` | Avaliação pública de atendimento |
| `/confirmar/[id]` | Confirmação pública de presença |
| `/sucesso` | Pagamento aprovado (Mercado Pago redirect) |
| `/cancelamento` | Pagamento cancelado (Mercado Pago redirect) |

---

## Checklist de produção

- [ ] Variáveis de ambiente configuradas no servidor
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio real
- [ ] `NEXT_PUBLIC_APP_URL` configurado no Supabase → Authentication → URL Configuration → Site URL
- [ ] `FOCUS_NFE_ENV=producao` (após testar em homologação)
- [ ] Migrations SQL executadas no Supabase
- [ ] Workers iniciados e monitorados (PM2 ou Docker)
- [ ] Redis com persistência habilitada (`appendonly yes`)
- [ ] Backup automático do banco (Supabase já inclui)
- [ ] Domínio com HTTPS (Supabase exige para Auth)
- [ ] Instância Evolution API conectada ao WhatsApp
- [ ] Webhook do Mercado Pago configurado para `/api/webhooks/mercadopago`
- [ ] Health check monitorado (`/api/health`)
- [ ] `sitemap.xml` acessível em `https://seudominio.com/sitemap.xml`

---

## Licença

Proprietário — todos os direitos reservados.
