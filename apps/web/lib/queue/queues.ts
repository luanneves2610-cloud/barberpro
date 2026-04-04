import { Queue } from 'bullmq'
import { redis } from './redis'

// Nomes das filas
export const QUEUE_WHATSAPP_REMINDER = 'whatsapp:reminder'
export const QUEUE_WHATSAPP_BLAST = 'whatsapp:blast'
export const QUEUE_NFE = 'nfe:emit'
export const QUEUE_BIRTHDAY = 'whatsapp:birthday'
export const QUEUE_REENGAGEMENT = 'whatsapp:reengagement'

// Lazy — só cria se Redis disponível
let reminderQueue: Queue | null = null
let blastQueue: Queue | null = null
let nfeQueue: Queue | null = null
let birthdayQueue: Queue | null = null
let reengagementQueue: Queue | null = null

function getConnection() {
  return redis
}

export function getReminderQueue() {
  if (!reminderQueue) {
    reminderQueue = new Queue(QUEUE_WHATSAPP_REMINDER, { connection: getConnection() })
  }
  return reminderQueue
}

export function getBlastQueue() {
  if (!blastQueue) {
    blastQueue = new Queue(QUEUE_WHATSAPP_BLAST, { connection: getConnection() })
  }
  return blastQueue
}

export function getNfeQueue() {
  if (!nfeQueue) {
    nfeQueue = new Queue(QUEUE_NFE, { connection: getConnection() })
  }
  return nfeQueue
}

// Jobs tipados
export interface ReminderJobData {
  appointmentId: string
  clientName: string
  clientPhone: string
  barberName: string
  serviceName: string
  date: string        // localeDateString
  startTime: string
  tenantName: string
}

export interface BlastJobData {
  tenantId: string
  phones: string[]
  message: string
}

export interface NfeJobData {
  appointmentId: string
  tenantId: string
}

export function getBirthdayQueue() {
  if (!birthdayQueue) {
    birthdayQueue = new Queue(QUEUE_BIRTHDAY, { connection: getConnection() })
  }
  return birthdayQueue
}

export function getReengagementQueue() {
  if (!reengagementQueue) {
    reengagementQueue = new Queue(QUEUE_REENGAGEMENT, { connection: getConnection() })
  }
  return reengagementQueue
}

// Cron jobs — agendados pelo scheduler, não há JobData estruturado
export interface BirthdayCronJobData { runAt: string }
export interface ReengagementCronJobData { runAt: string; inactiveDays: number }
