import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// MongoDB connection (singleton)
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

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// ---------- LLM bridge ----------
function callPawCoach(payload, timeoutMs = 110000) {
  return new Promise((resolve, reject) => {
    const script = path.join(process.cwd(), 'scripts', 'pawcoach.py')
    const pyBin = process.env.PYTHON_BIN || '/root/.venv/bin/python3'
    const proc = spawn(pyBin, [script], {
      env: { ...process.env },
    })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      reject(new Error('LLM timeout'))
    }, timeoutMs)
    proc.stdout.on('data', (d) => (out += d.toString()))
    proc.stderr.on('data', (d) => (err += d.toString()))
    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code !== 0 && !out) {
        return reject(new Error(`LLM exited ${code}: ${err}`))
      }
      try {
        const parsed = JSON.parse(out.trim())
        if (!parsed.ok) return reject(new Error(parsed.error || 'LLM error'))
        resolve(parsed.text)
      } catch (e) {
        reject(new Error(`Bad LLM output: ${out.slice(0, 500)} | stderr: ${err.slice(0, 200)}`))
      }
    })
    proc.stdin.write(JSON.stringify(payload))
    proc.stdin.end()
  })
}

// Extract JSON object from LLM text (handles ```json fences and stray text)
function extractJson(text) {
  if (!text) return null
  // Remove code fences
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  // Try direct parse
  try { return JSON.parse(t) } catch {}
  // Find first { ... last }
  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first >= 0 && last > first) {
    const inner = t.slice(first, last + 1)
    try { return JSON.parse(inner) } catch {}
  }
  return null
}

// ---------- Plan generation prompt ----------
function buildPlanSystemPrompt() {
  return `You are PawCoach, a world-class certified dog trainer (CCPDT-KA) and veterinary canine nutritionist.
You create personalized, safe, evidence-based plans tailored to each dog's breed, age, weight, activity, allergies, and behavior.
ALWAYS respond with VALID JSON only. No prose. No markdown fences. Just a JSON object.
Never recommend anything unsafe (chocolate, grapes, onions, xylitol, raw bones near small dogs, etc.).
Meal portions must be reasonable for the dog's weight and activity (use kcal/kg metabolic body weight guidelines).`
}

function buildPlanUserPrompt(dog, planType, extraContext = '') {
  const allergies = (dog.allergies && dog.allergies.length) ? dog.allergies.join(', ') : 'none'
  const issues = (dog.behaviorIssues && dog.behaviorIssues.length) ? dog.behaviorIssues.join(', ') : 'none'
  const goals = (dog.goals && dog.goals.length) ? dog.goals.join(', ') : 'general wellness'
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

${extraContext ? 'Additional context: ' + extraContext + '\n\n' : ''}Return STRICT JSON with this exact schema:
{
  "title": "string (catchy plan title)",
  "summary": "string (2-3 sentence personalized intro mentioning ${dog.name})",
  "durationWeeks": 4,
  "training": {
    "phases": [
      {
        "weekRange": "Week 1",
        "focus": "string",
        "goals": ["string"],
        "sessions": [
          { "day": "Mon", "durationMin": 15, "exercises": [{"name":"string","steps":["string"],"rewardCue":"string"}] }
        ]
      }
    ],
    "commands": [{"name":"sit","howTo":"string","commonMistakes":["string"]}],
    "behaviorTips": ["string"]
  },
  "nutrition": {
    "dailyCalories": 0,
    "mealsPerDay": 2,
    "meals": [
      { "name": "Breakfast", "recipe": "string", "portionGrams": 0, "calories": 0, "ingredients": ["string"] }
    ],
    "treats": [{"name":"string","caloriesEach":0,"maxPerDay":0}],
    "hydrationMl": 0,
    "avoid": ["string"]
  },
  "shoppingList": [{"item":"string","qty":"string","category":"food|treats|equipment|supplement"}],
  "milestones": [{"week":1,"goal":"string","successMetric":"string"}],
  "safetyNotes": ["string"]
}

If planType is 'training' only, set nutrition to null. If 'nutrition' only, set training to null. If 'combined', include both.
Make it specific, encouraging, and actionable. Use ${dog.name}'s name throughout.`
}

// ---------- Demo dog ----------
async function ensureDemoDog(db) {
  const existing = await db.collection('dogs').findOne({ id: 'demo-truffle' })
  if (existing) return existing
  const truffle = {
    id: 'demo-truffle',
    name: 'Truffle',
    breed: 'Black Labrador Retriever',
    ageYears: 2,
    weightKg: 28,
    activityLevel: 'high',
    allergies: ['chicken'],
    behaviorIssues: ['pulls on leash', 'jumps on guests'],
    goals: ['off-leash recall', 'lean muscle', 'calmer greetings'],
    notes: 'Loves water, very food motivated.',
    createdAt: new Date(),
    isDemo: true,
  }
  await db.collection('dogs').insertOne(truffle)
  return truffle
}

async function handleRoute(request, { params }) {
  const { path: pathSeg = [] } = params
  const route = `/${pathSeg.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // Health
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ ok: true, app: 'PawPlan AI' }))
    }

    // Seed demo
    if (route === '/seed' && method === 'POST') {
      const dog = await ensureDemoDog(db)
      const { _id, ...rest } = dog
      return handleCORS(NextResponse.json({ ok: true, dog: rest }))
    }

    // Dogs CRUD
    if (route === '/dogs' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.breed) {
        return handleCORS(NextResponse.json({ error: 'name and breed required' }, { status: 400 }))
      }
      const dog = {
        id: uuidv4(),
        name: body.name,
        breed: body.breed,
        ageYears: Number(body.ageYears) || 1,
        weightKg: Number(body.weightKg) || 10,
        activityLevel: body.activityLevel || 'moderate',
        allergies: Array.isArray(body.allergies) ? body.allergies : [],
        behaviorIssues: Array.isArray(body.behaviorIssues) ? body.behaviorIssues : [],
        goals: Array.isArray(body.goals) ? body.goals : [],
        notes: body.notes || '',
        createdAt: new Date(),
      }
      await db.collection('dogs').insertOne(dog)
      const { _id, ...rest } = dog
      return handleCORS(NextResponse.json(rest))
    }

    if (route === '/dogs' && method === 'GET') {
      await ensureDemoDog(db)
      const dogs = await db.collection('dogs').find({}).sort({ createdAt: 1 }).limit(200).toArray()
      return handleCORS(NextResponse.json(dogs.map(({ _id, ...r }) => r)))
    }

    if (route.startsWith('/dogs/') && method === 'GET') {
      const id = pathSeg[1]
      const dog = await db.collection('dogs').findOne({ id })
      if (!dog) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      const { _id, ...rest } = dog
      return handleCORS(NextResponse.json(rest))
    }

    if (route.startsWith('/dogs/') && method === 'DELETE') {
      const id = pathSeg[1]
      await db.collection('dogs').deleteOne({ id })
      await db.collection('plans').deleteMany({ dogId: id })
      await db.collection('progress').deleteMany({ dogId: id })
      await db.collection('messages').deleteMany({ dogId: id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    if (route.startsWith('/dogs/') && method === 'PUT') {
      const id = pathSeg[1]
      const body = await request.json()
      const update = { ...body }
      delete update.id
      delete update._id
      await db.collection('dogs').updateOne({ id }, { $set: update })
      const dog = await db.collection('dogs').findOne({ id })
      const { _id, ...rest } = dog
      return handleCORS(NextResponse.json(rest))
    }

    // Plan generation
    if (route === '/plans/generate' && method === 'POST') {
      const body = await request.json()
      const { dogId, planType = 'combined', extraContext = '' } = body
      const dog = await db.collection('dogs').findOne({ id: dogId })
      if (!dog) return handleCORS(NextResponse.json({ error: 'dog not found' }, { status: 404 }))

      // Pull recent progress for context
      const recentProgress = await db.collection('progress').find({ dogId }).sort({ createdAt: -1 }).limit(5).toArray()
      let context = extraContext
      if (recentProgress.length) {
        context += '\nRecent progress logs:\n' + recentProgress.map(p => `- ${new Date(p.createdAt).toDateString()}: weight ${p.weightKg || '?'}kg, session: ${p.sessionType || '-'}, notes: ${p.notes || '-'}`).join('\n')
      }

      const text = await callPawCoach({
        mode: 'plan',
        system: buildPlanSystemPrompt(),
        prompt: buildPlanUserPrompt(dog, planType, context),
        session_id: `plan-${dogId}-${Date.now()}`,
      })
      const planJson = extractJson(text)
      if (!planJson) {
        return handleCORS(NextResponse.json({ error: 'Could not parse plan', raw: text.slice(0, 1000) }, { status: 502 }))
      }
      const plan = {
        id: uuidv4(),
        dogId,
        planType,
        plan: planJson,
        createdAt: new Date(),
      }
      await db.collection('plans').insertOne(plan)
      const { _id, ...rest } = plan
      return handleCORS(NextResponse.json(rest))
    }

    if (route === '/plans' && method === 'GET') {
      const url = new URL(request.url)
      const dogId = url.searchParams.get('dogId')
      const q = dogId ? { dogId } : {}
      const plans = await db.collection('plans').find(q).sort({ createdAt: -1 }).limit(50).toArray()
      return handleCORS(NextResponse.json(plans.map(({ _id, ...r }) => r)))
    }

    if (route.startsWith('/plans/') && method === 'GET') {
      const id = pathSeg[1]
      const plan = await db.collection('plans').findOne({ id })
      if (!plan) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      const { _id, ...rest } = plan
      return handleCORS(NextResponse.json(rest))
    }

    if (route.startsWith('/plans/') && method === 'DELETE') {
      const id = pathSeg[1]
      await db.collection('plans').deleteOne({ id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // Chat with PawCoach (memory)
    if (route === '/chat' && method === 'POST') {
      const body = await request.json()
      const { dogId, sessionId, message } = body
      if (!dogId || !sessionId || !message) {
        return handleCORS(NextResponse.json({ error: 'dogId, sessionId, message required' }, { status: 400 }))
      }
      const dog = await db.collection('dogs').findOne({ id: dogId })
      if (!dog) return handleCORS(NextResponse.json({ error: 'dog not found' }, { status: 404 }))

      // Pull history for this session
      const prior = await db.collection('messages').find({ sessionId }).sort({ createdAt: 1 }).limit(40).toArray()
      const history = prior.map(m => ({ role: m.role, content: m.content }))

      // Pull latest plan + recent progress for context
      const latestPlan = await db.collection('plans').find({ dogId }).sort({ createdAt: -1 }).limit(1).toArray()
      const recentProgress = await db.collection('progress').find({ dogId }).sort({ createdAt: -1 }).limit(5).toArray()

      const allergies = (dog.allergies || []).join(', ') || 'none'
      const issues = (dog.behaviorIssues || []).join(', ') || 'none'
      const goals = (dog.goals || []).join(', ') || 'general wellness'
      let contextBlock = `You are PawCoach, an expert dog trainer and canine nutritionist.
You are coaching the owner of ${dog.name}, a ${dog.ageYears}-year-old ${dog.breed} (${dog.weightKg}kg, ${dog.activityLevel} activity).
Allergies: ${allergies}. Behavior issues: ${issues}. Goals: ${goals}.
`
      if (latestPlan.length) {
        const p = latestPlan[0].plan
        contextBlock += `\nCurrent plan: "${p.title}" — ${p.summary}\n`
      }
      if (recentProgress.length) {
        contextBlock += `\nRecent progress logs:\n` + recentProgress.map(p => `- ${new Date(p.createdAt).toDateString()}: ${p.sessionType || ''} ${p.notes ? '— ' + p.notes : ''} ${p.weightKg ? '(weight ' + p.weightKg + 'kg)' : ''}`).join('\n')
      }
      contextBlock += `\n\nBe warm, encouraging, specific, and concise. Suggest concrete next steps. Reference ${dog.name} by name. If the owner reports a problem, suggest 2-3 actionable alternatives.`

      // Persist user message
      const userMsgDoc = {
        id: uuidv4(),
        dogId,
        sessionId,
        role: 'user',
        content: message,
        createdAt: new Date(),
      }
      await db.collection('messages').insertOne(userMsgDoc)

      const reply = await callPawCoach({
        mode: 'chat',
        system: contextBlock,
        prompt: message,
        history,
        session_id: sessionId,
      })

      const aiMsgDoc = {
        id: uuidv4(),
        dogId,
        sessionId,
        role: 'assistant',
        content: reply,
        createdAt: new Date(),
      }
      await db.collection('messages').insertOne(aiMsgDoc)

      return handleCORS(NextResponse.json({ reply, message: aiMsgDoc }))
    }

    if (route.startsWith('/chat/') && method === 'GET') {
      const sessionId = pathSeg[1]
      const messages = await db.collection('messages').find({ sessionId }).sort({ createdAt: 1 }).limit(200).toArray()
      return handleCORS(NextResponse.json(messages.map(({ _id, ...r }) => r)))
    }

    // Progress logging
    if (route === '/progress' && method === 'POST') {
      const body = await request.json()
      if (!body.dogId) return handleCORS(NextResponse.json({ error: 'dogId required' }, { status: 400 }))
      const entry = {
        id: uuidv4(),
        dogId: body.dogId,
        sessionType: body.sessionType || 'general',
        durationMin: Number(body.durationMin) || 0,
        weightKg: body.weightKg ? Number(body.weightKg) : null,
        rating: Number(body.rating) || 3,
        notes: body.notes || '',
        createdAt: new Date(),
      }
      await db.collection('progress').insertOne(entry)
      const { _id, ...rest } = entry
      return handleCORS(NextResponse.json(rest))
    }

    if (route === '/progress' && method === 'GET') {
      const url = new URL(request.url)
      const dogId = url.searchParams.get('dogId')
      const q = dogId ? { dogId } : {}
      const entries = await db.collection('progress').find(q).sort({ createdAt: 1 }).limit(500).toArray()
      return handleCORS(NextResponse.json(entries.map(({ _id, ...r }) => r)))
    }

    if (route.startsWith('/progress/') && method === 'DELETE') {
      const id = pathSeg[1]
      await db.collection('progress').deleteOne({ id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // Adjust plan based on user feedback (re-generate using context)
    if (route === '/plans/adjust' && method === 'POST') {
      const body = await request.json()
      const { dogId, feedback } = body
      const dog = await db.collection('dogs').findOne({ id: dogId })
      if (!dog) return handleCORS(NextResponse.json({ error: 'dog not found' }, { status: 404 }))
      const prevPlans = await db.collection('plans').find({ dogId }).sort({ createdAt: -1 }).limit(1).toArray()
      let extra = `Owner feedback: ${feedback}.`
      if (prevPlans.length) {
        extra += ` Prior plan title: "${prevPlans[0].plan.title}". Refine the plan based on the feedback. Keep what worked, change what didn't.`
      }
      const text = await callPawCoach({
        mode: 'plan',
        system: buildPlanSystemPrompt(),
        prompt: buildPlanUserPrompt(dog, 'combined', extra),
        session_id: `plan-${dogId}-${Date.now()}`,
      })
      const planJson = extractJson(text)
      if (!planJson) return handleCORS(NextResponse.json({ error: 'parse fail' }, { status: 502 }))
      const plan = { id: uuidv4(), dogId, planType: 'combined', plan: planJson, createdAt: new Date(), refinedFromFeedback: feedback }
      await db.collection('plans').insertOne(plan)
      const { _id, ...rest } = plan
      return handleCORS(NextResponse.json(rest))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
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
