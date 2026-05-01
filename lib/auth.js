import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const SECRET = process.env.JWT_SECRET || 'dev-secret'
const COOKIE_NAME = 'pp_token'
const MAX_AGE = 60 * 60 * 24 * 30 // 30d

export async function hashPassword(p) {
  return bcrypt.hash(p, 10)
}
export async function verifyPassword(p, hash) {
  return bcrypt.compare(p, hash)
}
export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, { expiresIn: '30d' })
}
export function verifyToken(token) {
  try { return jwt.verify(token, SECRET) } catch { return null }
}

export function setAuthCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: MAX_AGE,
  })
}
export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME)
}
export function getTokenFromRequest(request) {
  const cookie = request.headers.get('cookie') || ''
  const m = cookie.match(/(?:^|;\s*)pp_token=([^;]+)/)
  if (m) return decodeURIComponent(m[1])
  // fallback: Authorization header
  const auth = request.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}
export async function getUserFromRequest(request, db) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload?.id) return null
  const user = await db.collection('users').findOne({ id: payload.id })
  return user || null
}

// Tier limits
export const LIMITS = {
  free: { plansPerMonth: 2, chatsPerDay: 30 },
  premium: { plansPerMonth: Infinity, chatsPerDay: Infinity },
}

export function userTier(user) {
  if (!user) return 'free'
  if (user.role === 'admin') return 'premium'
  const sub = user.subscription || {}
  if (sub.tier === 'premium' && sub.expiresAt && new Date(sub.expiresAt) > new Date()) return 'premium'
  return 'free'
}

export async function checkPlanLimit(db, user) {
  const tier = userTier(user)
  if (tier === 'premium') return { ok: true, tier, used: 0, limit: Infinity }
  const since = new Date(); since.setDate(since.getDate() - 30)
  const used = await db.collection('plans').countDocuments({ ownerId: user.id, createdAt: { $gte: since } })
  const limit = LIMITS.free.plansPerMonth
  return { ok: used < limit, tier, used, limit }
}
export async function checkChatLimit(db, user) {
  const tier = userTier(user)
  if (tier === 'premium') return { ok: true, tier, used: 0, limit: Infinity }
  const since = new Date(); since.setHours(since.getHours() - 24)
  const used = await db.collection('messages').countDocuments({ ownerId: user.id, role: 'user', createdAt: { $gte: since } })
  const limit = LIMITS.free.chatsPerDay
  return { ok: used < limit, tier, used, limit }
}
