import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import {
  hashPassword, verifyPassword, signToken, getUserFromRequest, userTier,
  checkPlanLimit, checkChatLimit
} from '@/lib/auth'

// MongoDB
let client
let db
async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'pawplan_ai')
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

// ---------- Python bridges ----------
function spawnPy(scriptName, payload, timeoutMs = 110000) {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), 'scripts', scriptName)
    const pyBin = process.env.PYTHON_BIN || '/root/.venv/bin/python3'
    const proc = spawn(pyBin, [script], { env: { ...process.env } })
    let out = '', err = ''
    const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('Timeout')) }, timeoutMs)
    proc.stdout.on('data', d => out += d.toString())
    proc.stderr.on('data', d => err += d.toString())
    proc.on('close', code => {
      clearTimeout(timer)
      if (code !== 0 && !out) return reject(new Error(`exit ${code}: ${err}`))
      try { resolve(JSON.parse(out.trim())) } catch (e) { reject(new Error(`Bad JSON: ${out.slice(0,400)}`)) }
    })
    proc.stdin.write(JSON.stringify(payload))
    proc.stdin.end()
  })
}

async function callPawCoach(payload) {
  const res = await spawnPy('pawcoach.py', payload, 110000)
  if (!res.ok) throw new Error(res.error || 'LLM error')
  return res.text
}
async function callStripe(payload) {
  const res = await spawnPy('stripe_helper.py', payload, 30000)
  if (!res.ok) throw new Error(res.error || 'Stripe error')
  return res
}

function extractJson(text) {
  if (!text) return null
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  try { return JSON.parse(t) } catch {}
  const f = t.indexOf('{'), l = t.lastIndexOf('}')
  if (f >= 0 && l > f) { try { return JSON.parse(t.slice(f, l+1)) } catch {} }
  return null
}

function buildPlanSystemPrompt() {
  return `You are PawCoach, a world-class certified dog trainer (CCPDT-KA) and veterinary canine nutritionist.
You create personalized, safe, evidence-based plans tailored to each dog's breed, age, weight, activity, allergies, and behavior.
ALWAYS respond with VALID JSON only. No prose. No markdown fences. Just a JSON object.
Never recommend anything unsafe (chocolate, grapes, onions, xylitol, raw bones near small dogs, etc.).
Meal portions must be reasonable for the dog's weight and activity (use kcal/kg metabolic body weight guidelines).`
}
function buildPlanUserPrompt(dog, planType, extraContext = '') {
  const allergies = (dog.allergies||[]).join(', ') || 'none'
  const issues = (dog.behaviorIssues||[]).join(', ') || 'none'
  const goals = (dog.goals||[]).join(', ') || 'general wellness'
  return `Generate a ${planType.toUpperCase()} plan for this dog.

Dog Profile:
- Name: ${dog.name}
- Breed: ${dog.breed}
- Age: ${dog.ageYears} years
- Weight: ${dog.weightKg} kg
- Activity Level: ${dog.activityLevel}
- Allergies: ${allergies}
- Behavior Issues: ${issues}
- Owner Goals: ${goals}

${extraContext ? 'Additional context: '+extraContext+'\n\n' : ''}Return STRICT JSON with this exact schema:
{
  "title": "string (catchy plan title)",
  "summary": "string (2-3 sentence personalized intro mentioning ${dog.name})",
  "durationWeeks": 4,
  "training": {
    "phases": [
      { "weekRange": "Week 1", "focus": "string", "goals": ["string"],
        "sessions": [{ "day":"Mon", "durationMin":15, "exercises":[{"name":"string","steps":["string"],"rewardCue":"string"}] }] }
    ],
    "commands": [{"name":"sit","howTo":"string","commonMistakes":["string"]}],
    "behaviorTips": ["string"]
  },
  "nutrition": {
    "dailyCalories": 0, "mealsPerDay": 2,
    "meals": [{ "name":"Breakfast","recipe":"string","portionGrams":0,"calories":0,"ingredients":["string"] }],
    "treats": [{"name":"string","caloriesEach":0,"maxPerDay":0}],
    "hydrationMl": 0, "avoid": ["string"]
  },
  "shoppingList": [{"item":"string","qty":"string","category":"food|treats|equipment|supplement"}],
  "milestones": [{"week":1,"goal":"string","successMetric":"string"}],
  "safetyNotes": ["string"]
}

If planType is 'training' only, set nutrition to null. If 'nutrition' only, set training to null. If 'combined', include both.
Make it specific, encouraging, and actionable. Use ${dog.name}'s name throughout.`
}

// ---------- Seed ----------
async function ensureDemoDog(db, ownerId) {
  const existing = await db.collection('dogs').findOne({ id: 'demo-truffle' })
  if (existing) return existing
  const truffle = {
    id: 'demo-truffle', ownerId: ownerId || 'system', name: 'Truffle',
    breed: 'Black Labrador Retriever', ageYears: 2, weightKg: 28, activityLevel: 'high',
    allergies: ['chicken'], behaviorIssues: ['pulls on leash','jumps on guests'],
    goals: ['off-leash recall','lean muscle','calmer greetings'],
    notes: 'Loves water, very food motivated.', createdAt: new Date(), isDemo: true,
  }
  await db.collection('dogs').insertOne(truffle)
  return truffle
}
async function ensureAdmin(db) {
  const existing = await db.collection('users').findOne({ email: 'admin@pawplan.ai' })
  if (existing) return existing
  const admin = {
    id: uuidv4(),
    email: 'admin@pawplan.ai',
    name: 'Admin',
    passwordHash: await hashPassword('ChangeMe123!'),
    role: 'admin',
    mustChangePassword: true,
    subscription: { tier: 'premium', plan: 'admin', expiresAt: null, autoRenew: false },
    createdAt: new Date(),
  }
  await db.collection('users').insertOne(admin)
  return admin
}

// ---------- Pricing (server-defined) ----------
const PLANS = {
  monthly: { amount: 12.99, currency: 'usd', label: 'Premium Monthly', durationDays: 30 },
  yearly:  { amount: 109.00, currency: 'usd', label: 'Premium Yearly',  durationDays: 365 },
}

function publicUser(u) {
  if (!u) return null
  return {
    id: u.id, email: u.email, name: u.name || '', role: u.role || 'user',
    mustChangePassword: !!u.mustChangePassword,
    subscription: u.subscription || { tier: 'free' },
    tier: userTier(u),
    createdAt: u.createdAt,
  }
}

async function requireUser(request, db) {
  const u = await getUserFromRequest(request, db)
  if (!u) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  return u
}
async function requireAdmin(request, db) {
  const u = await requireUser(request, db)
  if (u.role !== 'admin') throw Object.assign(new Error('Forbidden'), { status: 403 })
  return u
}

async function handleRoute(request, { params }) {
  const { path: pathSeg = [] } = params
  const route = `/${pathSeg.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // --- public ---
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ ok: true, app: 'PawPlan AI' }))
    }
    if (route === '/seed' && method === 'POST') {
      const admin = await ensureAdmin(db)
      const dog = await ensureDemoDog(db, admin.id)
      const { _id: _a, passwordHash: _p, ...adminPub } = admin
      const { _id, ...dogPub } = dog
      return handleCORS(NextResponse.json({ ok: true, dog: dogPub, adminEmail: adminPub.email }))
    }
    if (route === '/plans/pricing' && method === 'GET') {
      return handleCORS(NextResponse.json(PLANS))
    }

    // --- auth ---
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const email = (body.email||'').toLowerCase().trim()
      if (!email || !body.password || body.password.length < 6) {
        return handleCORS(NextResponse.json({ error: 'email + password (6+) required' }, { status: 400 }))
      }
      if (await db.collection('users').findOne({ email })) {
        return handleCORS(NextResponse.json({ error: 'Email already in use' }, { status: 409 }))
      }
      const user = {
        id: uuidv4(), email, name: body.name || '',
        passwordHash: await hashPassword(body.password),
        role: 'user', mustChangePassword: false,
        subscription: { tier: 'free', plan: null, expiresAt: null, autoRenew: false },
        createdAt: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = signToken(user)
      const res = NextResponse.json({ user: publicUser(user), token })
      res.cookies.set('pp_token', token, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60*60*24*30 })
      return handleCORS(res)
    }
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const email = (body.email||'').toLowerCase().trim()
      const user = await db.collection('users').findOne({ email })
      if (!user || !(await verifyPassword(body.password||'', user.passwordHash))) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }
      const token = signToken(user)
      const res = NextResponse.json({ user: publicUser(user), token })
      res.cookies.set('pp_token', token, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 60*60*24*30 })
      return handleCORS(res)
    }
    if (route === '/auth/logout' && method === 'POST') {
      const res = NextResponse.json({ ok: true })
      res.cookies.delete('pp_token')
      return handleCORS(res)
    }
    if (route === '/auth/me' && method === 'GET') {
      const u = await getUserFromRequest(request, db)
      return handleCORS(NextResponse.json({ user: publicUser(u) }))
    }
    if (route === '/auth/change-password' && method === 'POST') {
      const u = await requireUser(request, db)
      const body = await request.json()
      if (!body.newPassword || body.newPassword.length < 6) {
        return handleCORS(NextResponse.json({ error: 'newPassword (6+) required' }, { status: 400 }))
      }
      // Verify current unless mustChangePassword (first-login flow)
      if (!u.mustChangePassword) {
        if (!body.currentPassword || !(await verifyPassword(body.currentPassword, u.passwordHash))) {
          return handleCORS(NextResponse.json({ error: 'Current password incorrect' }, { status: 400 }))
        }
      }
      await db.collection('users').updateOne({ id: u.id }, {
        $set: { passwordHash: await hashPassword(body.newPassword), mustChangePassword: false }
      })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // --- usage ---
    if (route === '/usage' && method === 'GET') {
      const u = await requireUser(request, db)
      const planLimit = await checkPlanLimit(db, u)
      const chatLimit = await checkChatLimit(db, u)
      return handleCORS(NextResponse.json({ tier: planLimit.tier, plans: { used: planLimit.used, limit: planLimit.limit }, chats: { used: chatLimit.used, limit: chatLimit.limit } }))
    }

    // --- dogs (scoped to user) ---
    if (route === '/dogs' && method === 'POST') {
      const u = await requireUser(request, db)
      const body = await request.json()
      if (!body.name || !body.breed) return handleCORS(NextResponse.json({ error: 'name and breed required' }, { status: 400 }))
      const dog = {
        id: uuidv4(), ownerId: u.id, name: body.name, breed: body.breed,
        ageYears: Number(body.ageYears) || 1, weightKg: Number(body.weightKg) || 10,
        activityLevel: body.activityLevel || 'moderate',
        allergies: Array.isArray(body.allergies) ? body.allergies : [],
        behaviorIssues: Array.isArray(body.behaviorIssues) ? body.behaviorIssues : [],
        goals: Array.isArray(body.goals) ? body.goals : [],
        notes: body.notes || '', createdAt: new Date(),
      }
      await db.collection('dogs').insertOne(dog)
      const { _id, ...rest } = dog
      return handleCORS(NextResponse.json(rest))
    }
    if (route === '/dogs' && method === 'GET') {
      const u = await requireUser(request, db)
      await ensureDemoDog(db, u.id)
      const dogs = await db.collection('dogs').find({ $or: [{ ownerId: u.id }, { isDemo: true }] }).sort({ createdAt: 1 }).limit(200).toArray()
      return handleCORS(NextResponse.json(dogs.map(({ _id, ...r }) => r)))
    }
    if (route.startsWith('/dogs/') && method === 'GET') {
      const u = await requireUser(request, db)
      const id = pathSeg[1]
      const dog = await db.collection('dogs').findOne({ id })
      if (!dog) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      if (!dog.isDemo && dog.ownerId !== u.id && u.role !== 'admin') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const { _id, ...rest } = dog
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/dogs/') && method === 'DELETE') {
      const u = await requireUser(request, db)
      const id = pathSeg[1]
      const dog = await db.collection('dogs').findOne({ id })
      if (!dog) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      if (dog.isDemo) return handleCORS(NextResponse.json({ error: 'cannot delete demo' }, { status: 400 }))
      if (dog.ownerId !== u.id && u.role !== 'admin') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      await db.collection('dogs').deleteOne({ id })
      await db.collection('plans').deleteMany({ dogId: id })
      await db.collection('progress').deleteMany({ dogId: id })
      await db.collection('messages').deleteMany({ dogId: id })
      return handleCORS(NextResponse.json({ ok: true }))
    }
    if (route.startsWith('/dogs/') && method === 'PUT') {
      const u = await requireUser(request, db)
      const id = pathSeg[1]
      const dog = await db.collection('dogs').findOne({ id })
      if (!dog) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      if (!dog.isDemo && dog.ownerId !== u.id && u.role !== 'admin') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const body = await request.json()
      const update = { ...body }
      delete update.id; delete update._id; delete update.ownerId; delete update.isDemo
      await db.collection('dogs').updateOne({ id }, { $set: update })
      const updated = await db.collection('dogs').findOne({ id })
      const { _id, ...rest } = updated
      return handleCORS(NextResponse.json(rest))
    }

    // --- plans ---
    if (route === '/plans/generate' && method === 'POST') {
      const u = await requireUser(request, db)
      const limit = await checkPlanLimit(db, u)
      if (!limit.ok) return handleCORS(NextResponse.json({ error: 'plan_limit_reached', used: limit.used, limit: limit.limit, tier: limit.tier }, { status: 402 }))

      const body = await request.json()
      const { dogId, planType = 'combined', extraContext = '' } = body
      const dog = await db.collection('dogs').findOne({ id: dogId })
      if (!dog) return handleCORS(NextResponse.json({ error: 'dog not found' }, { status: 404 }))

      const recentProgress = await db.collection('progress').find({ dogId }).sort({ createdAt: -1 }).limit(5).toArray()
      let context = extraContext
      if (recentProgress.length) {
        context += '\nRecent progress logs:\n' + recentProgress.map(p => `- ${new Date(p.createdAt).toDateString()}: weight ${p.weightKg||'?'}kg, ${p.sessionType||'-'}: ${p.notes||'-'}`).join('\n')
      }
      const text = await callPawCoach({
        mode: 'plan',
        system: buildPlanSystemPrompt(),
        prompt: buildPlanUserPrompt(dog, planType, context),
        session_id: `plan-${dogId}-${Date.now()}`,
      })
      const planJson = extractJson(text)
      if (!planJson) return handleCORS(NextResponse.json({ error: 'parse fail', raw: text.slice(0,500) }, { status: 502 }))
      const plan = { id: uuidv4(), dogId, ownerId: u.id, planType, plan: planJson, createdAt: new Date() }
      await db.collection('plans').insertOne(plan)
      const { _id, ...rest } = plan
      return handleCORS(NextResponse.json(rest))
    }
    if (route === '/plans/adjust' && method === 'POST') {
      const u = await requireUser(request, db)
      const limit = await checkPlanLimit(db, u)
      if (!limit.ok) return handleCORS(NextResponse.json({ error: 'plan_limit_reached', used: limit.used, limit: limit.limit, tier: limit.tier }, { status: 402 }))

      const body = await request.json()
      const { dogId, feedback } = body
      const dog = await db.collection('dogs').findOne({ id: dogId })
      if (!dog) return handleCORS(NextResponse.json({ error: 'dog not found' }, { status: 404 }))
      const prev = await db.collection('plans').find({ dogId }).sort({ createdAt: -1 }).limit(1).toArray()
      let extra = `Owner feedback: ${feedback}.`
      if (prev.length) extra += ` Prior plan title: "${prev[0].plan.title}". Refine the plan based on the feedback. Keep what worked, change what didn't.`
      const text = await callPawCoach({
        mode: 'plan',
        system: buildPlanSystemPrompt(),
        prompt: buildPlanUserPrompt(dog, 'combined', extra),
        session_id: `plan-${dogId}-${Date.now()}`,
      })
      const planJson = extractJson(text)
      if (!planJson) return handleCORS(NextResponse.json({ error: 'parse fail' }, { status: 502 }))
      const plan = { id: uuidv4(), dogId, ownerId: u.id, planType: 'combined', plan: planJson, createdAt: new Date(), refinedFromFeedback: feedback }
      await db.collection('plans').insertOne(plan)
      const { _id, ...rest } = plan
      return handleCORS(NextResponse.json(rest))
    }
    if (route === '/plans' && method === 'GET') {
      const u = await requireUser(request, db)
      const url = new URL(request.url)
      const dogId = url.searchParams.get('dogId')
      const q = dogId ? { dogId } : { ownerId: u.id }
      const plans = await db.collection('plans').find(q).sort({ createdAt: -1 }).limit(50).toArray()
      return handleCORS(NextResponse.json(plans.map(({ _id, ...r }) => r)))
    }
    if (route.startsWith('/plans/') && pathSeg[1] && method === 'GET') {
      const u = await requireUser(request, db)
      const id = pathSeg[1]
      const plan = await db.collection('plans').findOne({ id })
      if (!plan) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      if (plan.ownerId !== u.id && u.role !== 'admin') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      const { _id, ...rest } = plan
      return handleCORS(NextResponse.json(rest))
    }
    if (route.startsWith('/plans/') && method === 'DELETE') {
      const u = await requireUser(request, db)
      const id = pathSeg[1]
      const plan = await db.collection('plans').findOne({ id })
      if (!plan) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      if (plan.ownerId !== u.id && u.role !== 'admin') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      await db.collection('plans').deleteOne({ id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // --- chat ---
    if (route === '/chat' && method === 'POST') {
      const u = await requireUser(request, db)
      const limit = await checkChatLimit(db, u)
      if (!limit.ok) return handleCORS(NextResponse.json({ error: 'chat_limit_reached', used: limit.used, limit: limit.limit, tier: limit.tier }, { status: 402 }))

      const body = await request.json()
      const { dogId, sessionId, message } = body
      if (!dogId || !sessionId || !message) return handleCORS(NextResponse.json({ error: 'dogId, sessionId, message required' }, { status: 400 }))
      const dog = await db.collection('dogs').findOne({ id: dogId })
      if (!dog) return handleCORS(NextResponse.json({ error: 'dog not found' }, { status: 404 }))

      const prior = await db.collection('messages').find({ sessionId }).sort({ createdAt: 1 }).limit(40).toArray()
      const history = prior.map(m => ({ role: m.role, content: m.content }))
      const latestPlan = await db.collection('plans').find({ dogId }).sort({ createdAt: -1 }).limit(1).toArray()
      const recentProgress = await db.collection('progress').find({ dogId }).sort({ createdAt: -1 }).limit(5).toArray()

      const allergies = (dog.allergies||[]).join(', ') || 'none'
      const issues = (dog.behaviorIssues||[]).join(', ') || 'none'
      const goals = (dog.goals||[]).join(', ') || 'general wellness'
      let ctx = `You are PawCoach, an expert dog trainer and canine nutritionist.
You are coaching the owner of ${dog.name}, a ${dog.ageYears}-year-old ${dog.breed} (${dog.weightKg}kg, ${dog.activityLevel} activity).
Allergies: ${allergies}. Behavior issues: ${issues}. Goals: ${goals}.\n`
      if (latestPlan.length) ctx += `\nCurrent plan: "${latestPlan[0].plan.title}" — ${latestPlan[0].plan.summary}\n`
      if (recentProgress.length) ctx += `\nRecent progress logs:\n` + recentProgress.map(p => `- ${new Date(p.createdAt).toDateString()}: ${p.sessionType||''} ${p.notes ? '— '+p.notes : ''}`).join('\n')
      ctx += `\n\nBe warm, encouraging, specific, and concise. Reference ${dog.name} by name. If the owner reports a problem, suggest 2-3 actionable alternatives.`

      await db.collection('messages').insertOne({ id: uuidv4(), dogId, ownerId: u.id, sessionId, role: 'user', content: message, createdAt: new Date() })

      const reply = await callPawCoach({ mode: 'chat', system: ctx, prompt: message, history, session_id: sessionId })

      const aiMsg = { id: uuidv4(), dogId, ownerId: u.id, sessionId, role: 'assistant', content: reply, createdAt: new Date() }
      await db.collection('messages').insertOne(aiMsg)
      return handleCORS(NextResponse.json({ reply, message: aiMsg }))
    }
    if (route.startsWith('/chat/') && method === 'GET') {
      const u = await requireUser(request, db)
      const sessionId = pathSeg[1]
      const q = u.role === 'admin' ? { sessionId } : { sessionId, ownerId: u.id }
      const messages = await db.collection('messages').find(q).sort({ createdAt: 1 }).limit(200).toArray()
      return handleCORS(NextResponse.json(messages.map(({ _id, ...r }) => r)))
    }

    // --- progress ---
    if (route === '/progress' && method === 'POST') {
      const u = await requireUser(request, db)
      const body = await request.json()
      if (!body.dogId) return handleCORS(NextResponse.json({ error: 'dogId required' }, { status: 400 }))
      const entry = {
        id: uuidv4(), ownerId: u.id, dogId: body.dogId,
        sessionType: body.sessionType || 'general',
        durationMin: Number(body.durationMin) || 0,
        weightKg: body.weightKg ? Number(body.weightKg) : null,
        rating: Number(body.rating) || 3,
        notes: body.notes || '', createdAt: new Date(),
      }
      await db.collection('progress').insertOne(entry)
      const { _id, ...rest } = entry
      return handleCORS(NextResponse.json(rest))
    }
    if (route === '/progress' && method === 'GET') {
      const u = await requireUser(request, db)
      const url = new URL(request.url)
      const dogId = url.searchParams.get('dogId')
      const q = dogId ? { dogId } : { ownerId: u.id }
      const entries = await db.collection('progress').find(q).sort({ createdAt: 1 }).limit(500).toArray()
      return handleCORS(NextResponse.json(entries.map(({ _id, ...r }) => r)))
    }

    // --- payments ---
    if (route === '/payments/checkout' && method === 'POST') {
      const u = await requireUser(request, db)
      const body = await request.json()
      const planKey = body.plan
      if (!PLANS[planKey]) return handleCORS(NextResponse.json({ error: 'Invalid plan' }, { status: 400 }))
      const plan = PLANS[planKey]
      const origin = body.originUrl || `https://${request.headers.get('host')}`
      const success_url = `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`
      const cancel_url = `${origin}/?payment=cancel`
      const meta = { user_id: u.id, plan: planKey, source: 'web' }
      const session = await callStripe({
        action: 'create_session', host_url: origin,
        amount: plan.amount, currency: plan.currency,
        success_url, cancel_url, metadata: meta,
      })
      await db.collection('payment_transactions').insertOne({
        id: uuidv4(), userId: u.id, sessionId: session.session_id, plan: planKey,
        amount: plan.amount, currency: plan.currency, status: 'initiated',
        paymentStatus: 'pending', metadata: meta, createdAt: new Date(),
      })
      return handleCORS(NextResponse.json({ url: session.url, sessionId: session.session_id }))
    }
    if (route.startsWith('/payments/status/') && method === 'GET') {
      const u = await requireUser(request, db)
      const sid = pathSeg[2]
      const txn = await db.collection('payment_transactions').findOne({ sessionId: sid })
      if (!txn) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      if (txn.userId !== u.id && u.role !== 'admin') return handleCORS(NextResponse.json({ error: 'forbidden' }, { status: 403 }))
      // Idempotent: if already paid, return cached
      if (txn.paymentStatus === 'paid') {
        return handleCORS(NextResponse.json({ status: txn.status, payment_status: txn.paymentStatus, amount: txn.amount, currency: txn.currency, plan: txn.plan }))
      }
      try {
        const stripe = await callStripe({ action: 'get_status', host_url: `https://${request.headers.get('host')}`, session_id: sid })
        // Update transaction
        await db.collection('payment_transactions').updateOne({ sessionId: sid }, { $set: { status: stripe.status, paymentStatus: stripe.payment_status, updatedAt: new Date() } })
        // If paid and not yet processed, grant subscription (idempotent guard via processedAt)
        if (stripe.payment_status === 'paid' && !txn.processedAt) {
          const planKey = txn.plan
          const cfg = PLANS[planKey]
          const now = new Date()
          const current = u.subscription || {}
          const baseDate = (current.tier === 'premium' && current.expiresAt && new Date(current.expiresAt) > now) ? new Date(current.expiresAt) : now
          const expiresAt = new Date(baseDate.getTime() + cfg.durationDays * 24*60*60*1000)
          await db.collection('users').updateOne({ id: u.id }, {
            $set: { subscription: { tier: 'premium', plan: planKey, expiresAt, autoRenew: true, lastPaymentSessionId: sid } }
          })
          await db.collection('payment_transactions').updateOne({ sessionId: sid }, { $set: { processedAt: new Date() } })
        }
        return handleCORS(NextResponse.json({ status: stripe.status, payment_status: stripe.payment_status, amount: stripe.amount_total, currency: stripe.currency, plan: txn.plan }))
      } catch (stripeErr) {
        // Stripe test sessions may not be immediately retrievable; return cached transaction data
        return handleCORS(NextResponse.json({ status: txn.status, payment_status: txn.paymentStatus, amount: txn.amount, currency: txn.currency, plan: txn.plan, note: 'Stripe session not yet available' }))
      }
    }
    if (route === '/payments/history' && method === 'GET') {
      const u = await requireUser(request, db)
      const txns = await db.collection('payment_transactions').find({ userId: u.id }).sort({ createdAt: -1 }).limit(50).toArray()
      return handleCORS(NextResponse.json(txns.map(({ _id, ...r }) => r)))
    }
    if (route === '/payments/cancel' && method === 'POST') {
      const u = await requireUser(request, db)
      await db.collection('users').updateOne({ id: u.id }, { $set: { 'subscription.autoRenew': false } })
      return handleCORS(NextResponse.json({ ok: true }))
    }
    if (route === '/webhook/stripe' && method === 'POST') {
      const sig = request.headers.get('stripe-signature') || ''
      const body = await request.arrayBuffer()
      const b64 = Buffer.from(body).toString('base64')
      try {
        const wh = await callStripe({ action: 'handle_webhook', host_url: `https://${request.headers.get('host')}`, body_b64: b64, signature: sig })
        if (wh.session_id && wh.payment_status === 'paid') {
          const txn = await db.collection('payment_transactions').findOne({ sessionId: wh.session_id })
          if (txn && !txn.processedAt) {
            const cfg = PLANS[txn.plan]
            const user = await db.collection('users').findOne({ id: txn.userId })
            const now = new Date()
            const current = user?.subscription || {}
            const baseDate = (current.tier === 'premium' && current.expiresAt && new Date(current.expiresAt) > now) ? new Date(current.expiresAt) : now
            const expiresAt = new Date(baseDate.getTime() + cfg.durationDays * 24*60*60*1000)
            await db.collection('users').updateOne({ id: txn.userId }, {
              $set: { subscription: { tier: 'premium', plan: txn.plan, expiresAt, autoRenew: true, lastPaymentSessionId: wh.session_id } }
            })
            await db.collection('payment_transactions').updateOne({ sessionId: wh.session_id }, { $set: { paymentStatus: 'paid', status: 'complete', processedAt: new Date(), updatedAt: new Date() } })
          }
        }
        return handleCORS(NextResponse.json({ ok: true }))
      } catch (e) {
        console.error('webhook err', e)
        return handleCORS(NextResponse.json({ ok: false, error: e.message }, { status: 400 }))
      }
    }

    // --- admin ---
    if (route === '/admin/stats' && method === 'GET') {
      await requireAdmin(request, db)
      const [users, dogs, plans, msgs, txns] = await Promise.all([
        db.collection('users').countDocuments({}),
        db.collection('dogs').countDocuments({}),
        db.collection('plans').countDocuments({}),
        db.collection('messages').countDocuments({}),
        db.collection('payment_transactions').find({ paymentStatus: 'paid' }).toArray(),
      ])
      const since = new Date(); since.setDate(since.getDate() - 30)
      const mrr = txns.filter(t => t.processedAt && new Date(t.processedAt) >= since).reduce((s, t) => s + (t.amount || 0), 0)
      const lifetimeRevenue = txns.reduce((s, t) => s + (t.amount || 0), 0)
      const premiumUsers = await db.collection('users').countDocuments({ 'subscription.tier': 'premium', 'subscription.expiresAt': { $gt: new Date() } })
      return handleCORS(NextResponse.json({ users, dogs, plans, msgs, mrr, lifetimeRevenue, premiumUsers }))
    }
    if (route === '/admin/users' && method === 'GET') {
      await requireAdmin(request, db)
      const users = await db.collection('users').find({}).sort({ createdAt: -1 }).limit(500).toArray()
      return handleCORS(NextResponse.json(users.map(u => ({ ...publicUser(u), createdAt: u.createdAt }))))
    }
    if (route.startsWith('/admin/users/') && method === 'DELETE') {
      const admin = await requireAdmin(request, db)
      const id = pathSeg[2]
      if (id === admin.id) return handleCORS(NextResponse.json({ error: 'cannot delete self' }, { status: 400 }))
      await db.collection('users').deleteOne({ id })
      await db.collection('dogs').deleteMany({ ownerId: id })
      await db.collection('plans').deleteMany({ ownerId: id })
      await db.collection('messages').deleteMany({ ownerId: id })
      await db.collection('progress').deleteMany({ ownerId: id })
      return handleCORS(NextResponse.json({ ok: true }))
    }
    if (route === '/admin/dogs' && method === 'GET') {
      await requireAdmin(request, db)
      const dogs = await db.collection('dogs').find({}).sort({ createdAt: -1 }).limit(500).toArray()
      return handleCORS(NextResponse.json(dogs.map(({ _id, ...r }) => r)))
    }
    if (route === '/admin/plans' && method === 'GET') {
      await requireAdmin(request, db)
      const plans = await db.collection('plans').find({}).sort({ createdAt: -1 }).limit(200).toArray()
      return handleCORS(NextResponse.json(plans.map(({ _id, plan, ...rest }) => ({ ...rest, title: plan?.title }))))
    }
    if (route === '/admin/transactions' && method === 'GET') {
      await requireAdmin(request, db)
      const txns = await db.collection('payment_transactions').find({}).sort({ createdAt: -1 }).limit(500).toArray()
      return handleCORS(NextResponse.json(txns.map(({ _id, ...r }) => r)))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    const status = error.status || 500
    if (status === 401 || status === 403) return handleCORS(NextResponse.json({ error: error.message }, { status }))
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
export const maxDuration = 120
