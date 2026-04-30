'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'
import {
  Bone, Dog as DogIcon, PawPrint, Sparkles, Apple, Dumbbell, Heart, ListChecks,
  Send, Loader2, Plus, Trash2, MessageSquare, Trophy, Flame, ShoppingBag, ChevronRight,
  Calendar, Activity, TrendingUp, Utensils, Stethoscope, Target, Wand2, Salad
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as ReTooltip, BarChart, Bar, CartesianGrid } from 'recharts'

const ACTIVITY_LEVELS = [
  { value: 'low', label: 'Low — short walks, mostly indoor' },
  { value: 'moderate', label: 'Moderate — daily walks + some play' },
  { value: 'high', label: 'High — runs, hikes, sports' },
  { value: 'working', label: 'Working — herding, agility, service' },
]

const HERO_IMG = 'https://images.unsplash.com/photo-1537204696486-967f1b7198c8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGRvZ3xlbnwwfHx8fDE3Nzc1OTI0NjJ8MA&ixlib=rb-4.1.0&q=85'
const FEAT_IMG_1 = 'https://images.unsplash.com/photo-1755259779844-5ff1219e8817?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHxyZXRyaWV2ZXIlMjB0cmFpbmluZ3xlbnwwfHx8fDE3Nzc1OTI0NjJ8MA&ixlib=rb-4.1.0&q=85'
const FEAT_IMG_2 = 'https://images.unsplash.com/photo-1529831129093-0fa4866281ee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwyfHxsYWJyYWRvcnxlbnwwfHx8fDE3Nzc1OTI0Njh8MA&ixlib=rb-4.1.0&q=85'

function api(path, opts = {}) {
  return fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
    return data
  })
}

// ========================= LANDING =========================
function Landing({ onStart }) {
  return (
    <div className="min-h-screen paw-grain">
      <header className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm">
            <PawPrint className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">PawPlan AI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#coach" className="hover:text-foreground">PawCoach</a>
        </nav>
        <Button onClick={onStart} className="rounded-full shadow-sm">
          Open dashboard <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </header>

      <section className="container mx-auto grid lg:grid-cols-2 gap-12 items-center pb-16 pt-8">
        <div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 mb-5 bg-accent text-accent-foreground border-0">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Powered by Gemini 2.5 Pro
          </Badge>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
            A personal trainer & nutritionist <span className="text-primary">for your dog.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            PawPlan AI builds phased weekly training schedules, custom meal plans with portions,
            shopping lists and milestones — tailored to your dog's breed, age, weight and goals.
            Then it learns from your feedback to keep getting better.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" onClick={onStart} className="rounded-full px-7 h-12 text-base shadow-lg shadow-primary/20">
              <Wand2 className="mr-2 h-5 w-5" /> Build my dog's plan
            </Button>
            <Button size="lg" variant="outline" onClick={onStart} className="rounded-full px-7 h-12 text-base">
              Try with demo dog 🐾
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary" /> Vet-aligned</div>
            <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Phased plans</div>
            <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Always-on coach</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-br from-primary/10 via-amber-200/30 to-emerald-200/30 blur-3xl rounded-[3rem]" />
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border bg-card">
            <img src={HERO_IMG} alt="Happy dog" className="w-full h-[520px] object-cover" />
            <div className="absolute top-5 right-5 bg-card/90 backdrop-blur rounded-2xl p-4 shadow-lg border max-w-[240px]">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5"/> Plan ready</div>
              <div className="font-display font-bold mt-1 leading-tight">Truffle's 4-Week Calm & Strong Plan</div>
              <div className="text-xs text-muted-foreground mt-1">28 sessions · 3 meals/day · 12 milestones</div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="container mx-auto py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-4xl font-bold">From profile to plan in seconds</h2>
          <p className="mt-3 text-muted-foreground text-lg">Tell us about your dog. Get a custom plan. Refine it with the PawCoach chat anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: DogIcon, title: '1. Profile', desc: 'Breed, age, weight, allergies, behavior, goals.' },
            { icon: Wand2, title: '2. Generate', desc: 'AI creates a phased training + nutrition plan instantly.' },
            { icon: TrendingUp, title: '3. Refine', desc: 'Log progress and chat with PawCoach to evolve the plan.' },
          ].map((s, i) => (
            <Card key={i} className="border-2 hover:border-primary/40 transition-all rounded-2xl">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <s.icon className="h-6 w-6" />
                </div>
                <CardTitle className="mt-3 font-display text-2xl">{s.title}</CardTitle>
                <CardDescription className="text-base">{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="container mx-auto py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-3xl overflow-hidden border shadow-xl">
          <img src={FEAT_IMG_1} alt="Training" className="w-full h-[420px] object-cover" />
        </div>
        <div>
          <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground border-0">Training</Badge>
          <h3 className="font-display text-4xl font-bold mt-3">Phased weekly schedules with the right exercises</h3>
          <p className="mt-3 text-muted-foreground text-lg">PawCoach matches your dog's breed and energy with the right commands, durations, reward cues, and progressively harder drills.</p>
          <ul className="mt-5 space-y-3">
            {['Specific commands with how-to + common mistakes', 'Daily session blueprints (5–25 min)', 'Behavior tips for pulling, jumping, recall'].map((t, i) => (
              <li key={i} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-primary" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container mx-auto py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="lg:order-2 rounded-3xl overflow-hidden border shadow-xl">
          <img src={FEAT_IMG_2} alt="Nutrition" className="w-full h-[420px] object-cover" />
        </div>
        <div className="lg:order-1">
          <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground border-0">Nutrition</Badge>
          <h3 className="font-display text-4xl font-bold mt-3">Recipes, portions, and a smart shopping list</h3>
          <p className="mt-3 text-muted-foreground text-lg">Daily calories matched to weight + activity. Allergy-aware. With treat budgets and a printable shopping list.</p>
          <ul className="mt-5 space-y-3">
            {['Calorie target + balanced meals', 'Avoid lists tailored to allergies', 'Treat budget so progress stays on track'].map((t, i) => (
              <li key={i} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-primary" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="coach" className="container mx-auto py-20">
        <Card className="rounded-3xl bg-gradient-to-br from-primary to-amber-500 border-0 text-primary-foreground overflow-hidden relative">
          <div className="absolute -right-16 -bottom-16 opacity-20">
            <PawPrint className="h-72 w-72" />
          </div>
          <CardContent className="p-12 relative">
            <h3 className="font-display text-4xl md:text-5xl font-extrabold max-w-2xl leading-tight">A coach that remembers your dog. And evolves with them.</h3>
            <p className="mt-4 max-w-xl text-primary-foreground/90 text-lg">Tell PawCoach what worked and what didn't. It updates the plan with concrete alternatives. Like having a trainer in your pocket.</p>
            <Button size="lg" onClick={onStart} variant="secondary" className="mt-6 rounded-full px-7 h-12">
              Get started free <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="container mx-auto py-10 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <PawPrint className="h-4 w-4 text-primary" /> PawPlan AI · Built with care for good boys & girls.
        </div>
        <div>© {new Date().getFullYear()} PawPlan AI</div>
      </footer>
    </div>
  )
}

// ========================= DOG FORM =========================
function DogForm({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({
    name: '', breed: '', ageYears: 1, weightKg: 10, activityLevel: 'moderate',
    allergies: '', behaviorIssues: '', goals: '', notes: '',
  })
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!form.name || !form.breed) return toast.error('Name and breed are required')
    setBusy(true)
    try {
      const dog = await api('/dogs', { method: 'POST', body: JSON.stringify({
        ...form,
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        behaviorIssues: form.behaviorIssues.split(',').map(s => s.trim()).filter(Boolean),
        goals: form.goals.split(',').map(s => s.trim()).filter(Boolean),
      }) })
      toast.success(`${dog.name} added!`)
      onCreated(dog)
      onOpenChange(false)
      setForm({ name:'', breed:'', ageYears:1, weightKg:10, activityLevel:'moderate', allergies:'', behaviorIssues:'', goals:'', notes:'' })
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add your dog</DialogTitle>
          <DialogDescription>The more PawCoach knows, the better the plan.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Buddy" /></div>
            <div><Label>Breed</Label><Input value={form.breed} onChange={e=>setForm({...form, breed:e.target.value})} placeholder="Golden Retriever" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Age (years)</Label><Input type="number" min="0" step="0.5" value={form.ageYears} onChange={e=>setForm({...form, ageYears:e.target.value})} /></div>
            <div><Label>Weight (kg)</Label><Input type="number" min="0" step="0.5" value={form.weightKg} onChange={e=>setForm({...form, weightKg:e.target.value})} /></div>
          </div>
          <div>
            <Label>Activity level</Label>
            <Select value={form.activityLevel} onValueChange={v=>setForm({...form, activityLevel:v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{ACTIVITY_LEVELS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Allergies <span className="text-xs text-muted-foreground">(comma separated)</span></Label><Input value={form.allergies} onChange={e=>setForm({...form, allergies:e.target.value})} placeholder="chicken, wheat" /></div>
          <div><Label>Behavior issues</Label><Input value={form.behaviorIssues} onChange={e=>setForm({...form, behaviorIssues:e.target.value})} placeholder="pulls on leash, barks at strangers" /></div>
          <div><Label>Goals</Label><Input value={form.goals} onChange={e=>setForm({...form, goals:e.target.value})} placeholder="off-leash recall, weight loss" /></div>
          <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} rows={2} placeholder="Loves water, food motivated..." /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : <>Add dog</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========================= PLAN VIEW =========================
function PlanCard({ plan }) {
  if (!plan) return null
  const p = plan.plan
  return (
    <Card className="rounded-2xl border-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-2 rounded-full">{plan.planType.toUpperCase()}</Badge>
            <CardTitle className="font-display text-2xl">{p.title}</CardTitle>
            <CardDescription className="text-base mt-1">{p.summary}</CardDescription>
          </div>
          <div className="text-xs text-muted-foreground">{new Date(plan.createdAt).toLocaleString()}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {p.training && (
          <section>
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><Dumbbell className="h-5 w-5 text-primary" /> Training</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {(p.training.phases || []).map((ph, i) => (
                <Card key={i} className="rounded-xl">
                  <CardHeader className="pb-2">
                    <div className="text-xs text-muted-foreground">{ph.weekRange}</div>
                    <CardTitle className="text-lg font-display">{ph.focus}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="list-disc pl-5 space-y-1">{(ph.goals||[]).map((g,j)=><li key={j}>{g}</li>)}</ul>
                    <Separator />
                    <div className="space-y-2">
                      {(ph.sessions||[]).map((s,j)=>(
                        <div key={j} className="text-xs">
                          <div className="font-semibold text-foreground">{s.day} · {s.durationMin} min</div>
                          {(s.exercises||[]).map((ex,k)=>(
                            <div key={k} className="ml-3 mt-1">
                              <div className="font-medium">• {ex.name}</div>
                              <ul className="ml-4 list-decimal text-muted-foreground">{(ex.steps||[]).map((st,m)=><li key={m}>{st}</li>)}</ul>
                              {ex.rewardCue && <div className="ml-4 text-emerald-700 text-xs">🎉 {ex.rewardCue}</div>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {p.training.commands?.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Commands</div>
                <div className="grid md:grid-cols-2 gap-2">
                  {p.training.commands.map((c,i)=>(
                    <div key={i} className="rounded-lg border p-3 bg-muted/30">
                      <div className="font-medium capitalize">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.howTo}</div>
                      {c.commonMistakes?.length>0 && <div className="mt-1 text-xs"><span className="font-semibold">Avoid:</span> {c.commonMistakes.join(' · ')}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {p.training.behaviorTips?.length > 0 && (
              <div className="mt-4 rounded-lg bg-accent/40 p-3 text-sm">
                <div className="font-semibold mb-1 flex items-center gap-1"><Heart className="h-4 w-4 text-primary"/>Behavior tips</div>
                <ul className="list-disc pl-5 space-y-1">{p.training.behaviorTips.map((t,i)=><li key={i}>{t}</li>)}</ul>
              </div>
            )}
          </section>
        )}

        {p.nutrition && (
          <section>
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><Salad className="h-5 w-5 text-emerald-600" /> Nutrition</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <Stat label="Daily kcal" value={p.nutrition.dailyCalories} />
              <Stat label="Meals/day" value={p.nutrition.mealsPerDay} />
              <Stat label="Hydration" value={`${p.nutrition.hydrationMl} ml`} />
              <Stat label="Treats" value={(p.nutrition.treats||[]).length} />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {(p.nutrition.meals||[]).map((m,i)=>(
                <Card key={i} className="rounded-xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-display">{m.name}</CardTitle>
                      <Badge variant="secondary" className="rounded-full">{m.calories} kcal</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>{m.recipe}</p>
                    <div className="text-xs text-muted-foreground">Portion: <b>{m.portionGrams}g</b></div>
                    <div className="flex flex-wrap gap-1">{(m.ingredients||[]).map((ing,j)=><Badge key={j} variant="outline" className="rounded-full text-xs">{ing}</Badge>)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {p.nutrition.avoid?.length > 0 && (
              <div className="mt-3 rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-sm">
                <div className="font-semibold mb-1 text-destructive">Avoid</div>
                <div className="flex flex-wrap gap-1">{p.nutrition.avoid.map((a,i)=><Badge key={i} variant="destructive" className="rounded-full">{a}</Badge>)}</div>
              </div>
            )}
          </section>
        )}

        {p.shoppingList?.length > 0 && (
          <section>
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><ShoppingBag className="h-5 w-5 text-primary" /> Shopping list</h4>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {p.shoppingList.map((s,i)=>(
                <div key={i} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <div><div className="font-medium">{s.item}</div><div className="text-xs text-muted-foreground capitalize">{s.category}</div></div>
                  <Badge variant="secondary" className="rounded-full">{s.qty}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {p.milestones?.length > 0 && (
          <section>
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><Trophy className="h-5 w-5 text-amber-500" /> Milestones</h4>
            <div className="space-y-2">
              {p.milestones.map((m,i)=>(
                <div key={i} className="rounded-lg border p-3 text-sm flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 grid place-items-center text-xs font-bold">W{m.week}</div>
                  <div><div className="font-medium">{m.goal}</div><div className="text-xs text-muted-foreground">{m.successMetric}</div></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {p.safetyNotes?.length > 0 && (
          <section className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm">
            <div className="font-semibold flex items-center gap-1 text-blue-900 mb-1"><Stethoscope className="h-4 w-4"/> Safety notes</div>
            <ul className="list-disc pl-5 space-y-1 text-blue-900/90">{p.safetyNotes.map((s,i)=><li key={i}>{s}</li>)}</ul>
          </section>
        )}
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-display font-bold">{value}</div>
    </div>
  )
}

// ========================= CHAT =========================
function PawCoachChat({ dog }) {
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const k = `pp-session-${dog.id}`
      const ex = localStorage.getItem(k)
      if (ex) return ex
      const n = `${dog.id}-${Date.now()}`
      localStorage.setItem(k, n)
      return n
    }
    return `${dog.id}-default`
  })
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    api(`/chat/${sessionId}`).then(setMessages).catch(()=>{})
  }, [sessionId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' })
  }, [messages, busy])

  const send = async () => {
    if (!input.trim() || busy) return
    const text = input.trim()
    setInput('')
    setMessages(m => [...m, { id: 'temp-'+Date.now(), role:'user', content:text, createdAt: new Date() }])
    setBusy(true)
    try {
      const res = await api('/chat', { method:'POST', body: JSON.stringify({ dogId: dog.id, sessionId, message: text }) })
      setMessages(m => [...m, res.message])
    } catch (e) {
      toast.error(e.message)
    } finally { setBusy(false) }
  }

  const suggestions = [
    `${dog.name} pulls on the leash — what should I do?`,
    `${dog.name} ignores the "sit" cue outdoors — alternatives?`,
    `Make today's meal lighter, ${dog.name} got too many treats.`,
    `Suggest a 10-minute high-value training game.`,
  ]

  return (
    <Card className="rounded-2xl border-2 flex flex-col h-[640px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-primary text-primary-foreground"><AvatarFallback className="bg-primary text-primary-foreground"><PawPrint className="h-5 w-5"/></AvatarFallback></Avatar>
          <div>
            <CardTitle className="font-display text-lg">PawCoach</CardTitle>
            <CardDescription className="text-xs">Coaching {dog.name} — remembers your history</CardDescription>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Start by asking PawCoach anything about {dog.name}.
              <div className="mt-4 grid sm:grid-cols-2 gap-2">
                {suggestions.map((s,i)=>(
                  <button key={i} onClick={()=>setInput(s)} className="text-left text-xs rounded-lg border bg-card hover:bg-accent p-3 transition-colors">{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role==='user' ? 'justify-end' : 'justify-start'}`}>
              {m.role !== 'user' && <div className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center shrink-0"><PawPrint className="h-4 w-4"/></div>}
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.content}</div>
            </div>
          ))}
          {busy && (
            <div className="flex gap-2 justify-start">
              <div className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center"><PawPrint className="h-4 w-4 wag"/></div>
              <div className="bg-muted rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> PawCoach is thinking...</div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-3 flex gap-2">
        <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=> e.key==='Enter' && send()} placeholder={`Ask about ${dog.name}...`} disabled={busy} />
        <Button onClick={send} disabled={busy || !input.trim()} className="rounded-full"><Send className="h-4 w-4"/></Button>
      </div>
    </Card>
  )
}

// ========================= PROGRESS =========================
function ProgressTab({ dog }) {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({ sessionType:'training', durationMin:15, weightKg:'', rating:4, notes:'' })
  const [busy, setBusy] = useState(false)
  const [refining, setRefining] = useState(false)
  const [feedback, setFeedback] = useState('')

  const load = () => api(`/progress?dogId=${dog.id}`).then(setEntries).catch(()=>{})
  useEffect(() => { load() }, [dog.id])

  const submit = async () => {
    setBusy(true)
    try {
      await api('/progress', { method:'POST', body: JSON.stringify({ dogId: dog.id, ...form }) })
      toast.success('Logged!')
      setForm({ sessionType:'training', durationMin:15, weightKg:'', rating:4, notes:'' })
      load()
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  const refine = async () => {
    if (!feedback.trim()) return toast.error('Tell PawCoach what to refine')
    setRefining(true)
    try {
      const newPlan = await api('/plans/adjust', { method:'POST', body: JSON.stringify({ dogId: dog.id, feedback }) })
      toast.success('Plan refined! Check the Plans tab.')
      setFeedback('')
    } catch (e) { toast.error(e.message) } finally { setRefining(false) }
  }

  const chartData = useMemo(() => entries.map(e => ({
    date: new Date(e.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric' }),
    weight: e.weightKg || null,
    rating: e.rating || null,
    duration: e.durationMin || 0,
  })), [entries])

  const streak = useMemo(() => {
    if (!entries.length) return 0
    const days = new Set(entries.map(e => new Date(e.createdAt).toDateString()))
    let s = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      if (days.has(d.toDateString())) s++; else if (i>0) break
    }
    return s
  }, [entries])

  const totalMin = entries.reduce((a,e) => a + (e.durationMin || 0), 0)
  const avgRating = entries.length ? (entries.reduce((a,e)=>a+(e.rating||0),0) / entries.length).toFixed(1) : '—'

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-2 rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/> Progress</CardTitle>
          <CardDescription>Track sessions, weight, and how it's going.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Streak" value={`${streak}d 🔥`} />
            <Stat label="Total minutes" value={totalMin} />
            <Stat label="Avg rating" value={avgRating} />
          </div>
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ReTooltip contentStyle={{ borderRadius:12, border:'1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="rating" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 3 }} name="Rating" />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 3 }} name="Weight (kg)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-sm text-muted-foreground">Log a session to see progress charts.</div>
            )}
          </div>

          <Separator className="my-5" />
          <div>
            <div className="font-display text-lg font-bold mb-3">Recent logs</div>
            <div className="space-y-2 max-h-72 overflow-auto">
              {[...entries].reverse().map(e => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <div className="font-medium capitalize">{e.sessionType} · {e.durationMin}m · ⭐{e.rating}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</div>
                    {e.notes && <div className="text-xs mt-1">{e.notes}</div>}
                  </div>
                  {e.weightKg && <Badge variant="secondary" className="rounded-full">{e.weightKg} kg</Badge>}
                </div>
              ))}
              {entries.length === 0 && <div className="text-sm text-muted-foreground">No logs yet.</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><Plus className="h-5 w-5 text-primary"/> Log session</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Type</Label>
              <Select value={form.sessionType} onValueChange={v=>setForm({...form, sessionType:v})}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="walk">Walk</SelectItem>
                  <SelectItem value="play">Play</SelectItem>
                  <SelectItem value="meal">Meal/Nutrition</SelectItem>
                  <SelectItem value="vet">Vet</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Duration (min)</Label><Input type="number" value={form.durationMin} onChange={e=>setForm({...form, durationMin:e.target.value})} /></div>
              <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={form.weightKg} onChange={e=>setForm({...form, weightKg:e.target.value})} placeholder="optional"/></div>
            </div>
            <div>
              <Label>How did it go? (1-5)</Label>
              <div className="flex gap-2 mt-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={()=>setForm({...form, rating:n})} className={`h-9 w-9 rounded-full text-sm font-semibold ${form.rating>=n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} placeholder={`What happened with ${dog.name}?`} /></div>
            <Button onClick={submit} disabled={busy} className="w-full rounded-full">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <>Log it</>}</Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-primary/30 bg-primary/5">
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary"/> Refine plan</CardTitle><CardDescription>Tell PawCoach what to change. It rewrites the plan.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder={`E.g. ${dog.name} loved the recall game. The morning meal was too much — make portions smaller.`} />
            <Button onClick={refine} disabled={refining} className="w-full rounded-full">
              {refining ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Refining...</> : <><Sparkles className="h-4 w-4 mr-2"/>Refine my plan</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ========================= DASHBOARD =========================
function Dashboard({ onBack }) {
  const [dogs, setDogs] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [plans, setPlans] = useState([])
  const [openForm, setOpenForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [planType, setPlanType] = useState('combined')
  const [tab, setTab] = useState('plan')

  const active = dogs.find(d => d.id === activeId)

  const refreshDogs = async () => {
    const list = await api('/dogs')
    setDogs(list)
    if (!activeId && list.length) setActiveId(list[0].id)
  }

  useEffect(() => { refreshDogs() }, [])

  useEffect(() => {
    if (activeId) api(`/plans?dogId=${activeId}`).then(setPlans).catch(()=>{})
  }, [activeId, generating])

  const generate = async () => {
    if (!active) return
    setGenerating(true)
    try {
      const newPlan = await api('/plans/generate', { method:'POST', body: JSON.stringify({ dogId: active.id, planType }) })
      toast.success('Plan ready!')
      setPlans(p => [newPlan, ...p])
      setTab('plan')
    } catch (e) { toast.error(e.message) } finally { setGenerating(false) }
  }

  const removeDog = async (id) => {
    if (!confirm('Delete this dog and all their data?')) return
    await api(`/dogs/${id}`, { method:'DELETE' })
    toast.success('Removed')
    if (activeId === id) setActiveId(null)
    refreshDogs()
  }

  const latestPlan = plans[0]

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="flex">
        <aside className="w-72 border-r min-h-screen p-5 sticky top-0 hidden lg:block">
          <button onClick={onBack} className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center"><PawPrint className="h-4 w-4"/></div>
            <span className="font-display font-bold">PawPlan AI</span>
          </button>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your dogs</div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>setOpenForm(true)}><Plus className="h-4 w-4"/></Button>
          </div>
          <div className="space-y-1">
            {dogs.map(d => (
              <button key={d.id} onClick={()=>setActiveId(d.id)} className={`w-full text-left rounded-xl p-3 flex items-center gap-3 transition-colors ${activeId===d.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'}`}>
                <Avatar className="h-9 w-9"><AvatarFallback className="bg-amber-100 text-amber-700"><DogIcon className="h-4 w-4"/></AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-1">{d.name} {d.isDemo && <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">demo</Badge>}</div>
                  <div className="text-xs text-muted-foreground truncate">{d.breed}</div>
                </div>
                {!d.isDemo && (
                  <button onClick={(e)=>{e.stopPropagation(); removeDog(d.id)}} className="opacity-0 group-hover:opacity-100 hover:text-destructive"><Trash2 className="h-3.5 w-3.5"/></button>
                )}
              </button>
            ))}
          </div>
          <Button onClick={()=>setOpenForm(true)} variant="outline" className="w-full mt-3 rounded-full"><Plus className="h-4 w-4 mr-2"/>Add dog</Button>
        </aside>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground grid place-items-center"><PawPrint className="h-4 w-4"/></div>
              <span className="font-display font-bold">PawPlan AI</span>
            </button>
            <Button size="sm" onClick={()=>setOpenForm(true)} variant="outline"><Plus className="h-4 w-4 mr-1"/>Dog</Button>
          </div>

          {/* Mobile dog selector */}
          <div className="lg:hidden mb-4">
            <Select value={activeId || ''} onValueChange={setActiveId}>
              <SelectTrigger><SelectValue placeholder="Choose a dog..."/></SelectTrigger>
              <SelectContent>{dogs.map(d => <SelectItem key={d.id} value={d.id}>{d.name} — {d.breed}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {!active ? (
            <Card className="rounded-2xl"><CardContent className="p-12 text-center">
              <DogIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
              <div className="font-display text-xl font-bold mb-1">Add your first dog</div>
              <div className="text-muted-foreground mb-4">Tell PawCoach about them to get a custom plan.</div>
              <Button onClick={()=>setOpenForm(true)}><Plus className="h-4 w-4 mr-1"/>Add dog</Button>
            </CardContent></Card>
          ) : (
            <>
              {/* Header */}
              <div className="rounded-3xl border-2 bg-gradient-to-br from-primary/10 via-amber-100/40 to-emerald-100/30 p-6 mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg"><DogIcon className="h-8 w-8"/></div>
                    <div>
                      <h1 className="font-display text-3xl font-extrabold">{active.name}</h1>
                      <div className="text-muted-foreground">{active.breed} · {active.ageYears}yr · {active.weightKg}kg · {active.activityLevel}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(active.allergies||[]).map((a,i)=><Badge key={i} variant="destructive" className="rounded-full">⚠ {a}</Badge>)}
                        {(active.goals||[]).map((g,i)=><Badge key={i} variant="secondary" className="rounded-full bg-emerald-100 text-emerald-800 border-0">🎯 {g}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={planType} onValueChange={setPlanType}>
                      <SelectTrigger className="w-[170px] bg-card"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="combined">Training + Nutrition</SelectItem>
                        <SelectItem value="training">Training only</SelectItem>
                        <SelectItem value="nutrition">Nutrition only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={generate} disabled={generating} size="lg" className="rounded-full shadow-lg shadow-primary/30">
                      {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>PawCoach is planning...</> : <><Wand2 className="h-4 w-4 mr-2"/>Generate plan</>}
                    </Button>
                  </div>
                </div>
              </div>

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="rounded-full bg-muted p-1 h-11">
                  <TabsTrigger value="plan" className="rounded-full px-5"><ListChecks className="h-4 w-4 mr-2"/>Plan</TabsTrigger>
                  <TabsTrigger value="coach" className="rounded-full px-5"><MessageSquare className="h-4 w-4 mr-2"/>PawCoach</TabsTrigger>
                  <TabsTrigger value="progress" className="rounded-full px-5"><Activity className="h-4 w-4 mr-2"/>Progress</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-full px-5"><Calendar className="h-4 w-4 mr-2"/>History</TabsTrigger>
                </TabsList>

                <TabsContent value="plan" className="mt-5">
                  {generating && (
                    <Card className="rounded-2xl border-2 border-dashed mb-4 border-primary/40 bg-primary/5">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><PawPrint className="h-5 w-5 wag"/></div>
                        <div>
                          <div className="font-display font-bold">PawCoach is crafting {active.name}'s plan…</div>
                          <div className="text-sm text-muted-foreground">Analyzing breed, weight, allergies, goals and recent progress.</div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {latestPlan ? <PlanCard plan={latestPlan}/> : (
                    <Card className="rounded-2xl border-dashed border-2"><CardContent className="p-12 text-center">
                      <Wand2 className="h-10 w-10 mx-auto text-muted-foreground mb-2"/>
                      <div className="font-display text-xl font-bold mb-1">No plan yet</div>
                      <div className="text-muted-foreground mb-4">Click Generate plan to get a custom 4-week plan for {active.name}.</div>
                    </CardContent></Card>
                  )}
                </TabsContent>

                <TabsContent value="coach" className="mt-5">
                  <PawCoachChat dog={active}/>
                </TabsContent>

                <TabsContent value="progress" className="mt-5">
                  <ProgressTab dog={active}/>
                </TabsContent>

                <TabsContent value="history" className="mt-5">
                  <Card className="rounded-2xl">
                    <CardHeader><CardTitle className="font-display">Plan history</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {plans.length === 0 && <div className="text-sm text-muted-foreground">No plans yet.</div>}
                        {plans.map(p => (
                          <div key={p.id} className="rounded-xl border p-4 flex items-start justify-between gap-3">
                            <div>
                              <div className="font-display font-bold">{p.plan.title}</div>
                              <div className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleString()} · {p.planType}</div>
                              {p.refinedFromFeedback && <div className="text-xs mt-1 italic">Refined from: "{p.refinedFromFeedback}"</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>

      <DogForm open={openForm} onOpenChange={setOpenForm} onCreated={(d)=>{ setDogs(prev=>[...prev, d]); setActiveId(d.id) }}/>
    </div>
  )
}

// ========================= APP =========================
function App() {
  const [view, setView] = useState('landing')
  return view === 'landing'
    ? <Landing onStart={() => setView('app')} />
    : <Dashboard onBack={() => setView('landing')} />
}

export default App
