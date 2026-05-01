'use client'

import { useEffect, useMemo, useRef, useState, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress as ProgressBar } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Bone, Dog as DogIcon, PawPrint, Sparkles, Apple, Dumbbell, Heart, ListChecks,
  Send, Loader2, Plus, Trash2, MessageSquare, Trophy, ShoppingBag, ChevronRight,
  Calendar, Activity, TrendingUp, Stethoscope, Wand2, Salad, LogOut, User, Crown,
  Shield, CreditCard, Check, X, Lock, BarChart3, Users as UsersIcon, FileText, DollarSign, ArrowLeft, Camera
} from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid } from 'recharts'

// =================================================================
// API HELPER
// =================================================================
function api(path, opts = {}) {
  return fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...opts,
  }).then(async (r) => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      const err = new Error(data.error || `HTTP ${r.status}`)
      err.status = r.status
      err.data = data
      throw err
    }
    return data
  })
}

// =================================================================
// AUTH CONTEXT
// =================================================================
const AuthCtx = createContext(null)
function useAuth() { return useContext(AuthCtx) }

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const r = await api('/auth/me')
      setUser(r.user)
    } catch { setUser(null) }
  }

  useEffect(() => { (async () => { await refresh(); setLoading(false) })() }, [])

  const login = async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    setUser(r.user)
    return r.user
  }
  const register = async (email, password, name) => {
    const r = await api('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) })
    setUser(r.user)
    return r.user
  }
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); setUser(null) }

  return <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthCtx.Provider>
}

const ACTIVITY_LEVELS = [
  { value: 'low', label: 'Low — short walks, mostly indoor' },
  { value: 'moderate', label: 'Moderate — daily walks + some play' },
  { value: 'high', label: 'High — runs, hikes, sports' },
  { value: 'working', label: 'Working — herding, agility, service' },
]

const HERO_IMG = 'https://images.unsplash.com/photo-1537204696486-967f1b7198c8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGRvZ3xlbnwwfHx8fDE3Nzc1OTI0NjJ8MA&ixlib=rb-4.1.0&q=85'
const FEAT_IMG_1 = 'https://images.unsplash.com/photo-1755259779844-5ff1219e8817?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHxyZXRyaWV2ZXIlMjB0cmFpbmluZ3xlbnwwfHx8fDE3Nzc1OTI0NjJ8MA&ixlib=rb-4.1.0&q=85'
const FEAT_IMG_2 = 'https://images.unsplash.com/photo-1529831129093-0fa4866281ee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwyfHxsYWJyYWRvcnxlbnwwfHx8fDE3Nzc1OTI0Njh8MA&ixlib=rb-4.1.0&q=85'

// =================================================================
// HEADER (used everywhere except landing)
// =================================================================
function AppHeader({ go }) {
  const { user, logout } = useAuth()
  const isPremium = user?.tier === 'premium'
  return (
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto flex items-center justify-between h-16">
        <button onClick={() => go('home')} className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm"><PawPrint className="h-5 w-5"/></div>
          <span className="font-display text-xl font-bold">PawPlan AI</span>
        </button>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {user && <Button variant="ghost" onClick={()=>go('dashboard')}>Dashboard</Button>}
          <Button variant="ghost" onClick={()=>go('pricing')}>Pricing</Button>
          {user?.role === 'admin' && <Button variant="ghost" onClick={()=>go('admin')}><Shield className="h-4 w-4 mr-1"/>Admin</Button>}
        </nav>
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button variant="ghost" onClick={()=>go('login')}>Sign in</Button>
              <Button onClick={()=>go('register')} className="rounded-full">Get started</Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full pl-2 pr-3 gap-2 h-9">
                  <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{(user.name || user.email)[0].toUpperCase()}</AvatarFallback></Avatar>
                  <span className="hidden sm:inline">{user.name || user.email.split('@')[0]}</span>
                  {isPremium && <Crown className="h-3.5 w-3.5 text-amber-500"/>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold">{user.name || 'My account'}</div>
                  <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={()=>go('dashboard')}><DogIcon className="h-4 w-4 mr-2"/>Dashboard</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>go('account')}><User className="h-4 w-4 mr-2"/>Account & billing</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>go('pricing')}><Crown className="h-4 w-4 mr-2"/>Upgrade</DropdownMenuItem>
                {user.role === 'admin' && <DropdownMenuItem onClick={()=>go('admin')}><Shield className="h-4 w-4 mr-2"/>Admin</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async ()=>{ await logout(); go('home') }} className="text-destructive"><LogOut className="h-4 w-4 mr-2"/>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}

// =================================================================
// LANDING
// =================================================================
function Landing({ go }) {
  const { user } = useAuth()
  return (
    <div className="min-h-screen paw-grain">
      <header className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm"><PawPrint className="h-5 w-5"/></div>
          <span className="font-display text-xl font-bold">PawPlan AI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground">How it works</a>
          <a href="#features" className="hover:text-foreground">Features</a>
          <button onClick={()=>go('pricing')} className="hover:text-foreground">Pricing</button>
        </nav>
        <div className="flex items-center gap-2">
          {user ? <Button onClick={()=>go('dashboard')} className="rounded-full">Dashboard <ChevronRight className="ml-1 h-4 w-4"/></Button> : (
            <>
              <Button variant="ghost" onClick={()=>go('login')}>Sign in</Button>
              <Button onClick={()=>go('register')} className="rounded-full">Get started</Button>
            </>
          )}
        </div>
      </header>

      <section className="container mx-auto grid lg:grid-cols-2 gap-12 items-center pb-16 pt-8">
        <div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 mb-5 bg-accent text-accent-foreground border-0">
            <Sparkles className="h-3.5 w-3.5 mr-1.5"/> Powered by Gemini 2.5 Pro
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
            <Button size="lg" onClick={()=>go(user ? 'dashboard' : 'register')} className="rounded-full px-7 h-12 text-base shadow-lg shadow-primary/20">
              <Wand2 className="mr-2 h-5 w-5"/> Build my dog's plan
            </Button>
            <Button size="lg" variant="outline" onClick={()=>go(user ? 'dashboard' : 'register')} className="rounded-full px-7 h-12 text-base">
              Try with demo dog 🐾
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-primary"/> Vet-aligned</div>
            <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary"/> Phased plans</div>
            <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary"/> Always-on coach</div>
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
          {[{icon:DogIcon,title:'1. Profile',desc:'Breed, age, weight, allergies, behavior, goals.'},
            {icon:Wand2,title:'2. Generate',desc:'AI creates a phased training + nutrition plan instantly.'},
            {icon:TrendingUp,title:'3. Refine',desc:'Log progress and chat with PawCoach to evolve the plan.'}].map((s,i)=>(
            <Card key={i} className="border-2 hover:border-primary/40 transition-all rounded-2xl">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary grid place-items-center"><s.icon className="h-6 w-6"/></div>
                <CardTitle className="mt-3 font-display text-2xl">{s.title}</CardTitle>
                <CardDescription className="text-base">{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="container mx-auto py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-3xl overflow-hidden border shadow-xl">
          <img src={FEAT_IMG_1} alt="Training" className="w-full h-[420px] object-cover"/>
        </div>
        <div>
          <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground border-0">Training</Badge>
          <h3 className="font-display text-4xl font-bold mt-3">Phased weekly schedules with the right exercises</h3>
          <p className="mt-3 text-muted-foreground text-lg">PawCoach matches your dog's breed and energy with the right commands, durations, reward cues, and progressively harder drills.</p>
          <ul className="mt-5 space-y-3">
            {['Specific commands with how-to + common mistakes','Daily session blueprints (5–25 min)','Behavior tips for pulling, jumping, recall'].map((t,i)=>(
              <li key={i} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-primary"/>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container mx-auto py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="lg:order-2 rounded-3xl overflow-hidden border shadow-xl">
          <img src={FEAT_IMG_2} alt="Nutrition" className="w-full h-[420px] object-cover"/>
        </div>
        <div className="lg:order-1">
          <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground border-0">Nutrition</Badge>
          <h3 className="font-display text-4xl font-bold mt-3">Recipes, portions, and a smart shopping list</h3>
          <p className="mt-3 text-muted-foreground text-lg">Daily calories matched to weight + activity. Allergy-aware. With treat budgets and a printable shopping list.</p>
          <ul className="mt-5 space-y-3">
            {['Calorie target + balanced meals','Avoid lists tailored to allergies','Treat budget so progress stays on track'].map((t,i)=>(
              <li key={i} className="flex gap-3"><div className="mt-1 h-2 w-2 rounded-full bg-primary"/>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container mx-auto py-20">
        <Card className="rounded-3xl bg-gradient-to-br from-primary to-amber-500 border-0 text-primary-foreground overflow-hidden relative">
          <div className="absolute -right-16 -bottom-16 opacity-20"><PawPrint className="h-72 w-72"/></div>
          <CardContent className="p-12 relative">
            <h3 className="font-display text-4xl md:text-5xl font-extrabold max-w-2xl leading-tight">A coach that remembers your dog. And evolves with them.</h3>
            <p className="mt-4 max-w-xl text-primary-foreground/90 text-lg">Tell PawCoach what worked and what didn't. It updates the plan with concrete alternatives. Like having a trainer in your pocket.</p>
            <Button size="lg" onClick={()=>go(user ? 'dashboard' : 'register')} variant="secondary" className="mt-6 rounded-full px-7 h-12">
              Get started free <ChevronRight className="ml-1 h-4 w-4"/>
            </Button>
          </CardContent>
        </Card>
      </section>

      <footer className="container mx-auto py-10 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2"><PawPrint className="h-4 w-4 text-primary"/> PawPlan AI · Built with care for good boys & girls.</div>
        <div>© {new Date().getFullYear()} PawPlan AI</div>
      </footer>
    </div>
  )
}

// =================================================================
// AUTH PAGES (Login / Register)
// =================================================================
function AuthCard({ go, mode }) {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email || !password) return toast.error('Email & password required')
    setBusy(true)
    try {
      const u = mode === 'login' ? await login(email, password) : await register(email, password, name)
      toast.success(mode === 'login' ? 'Welcome back!' : `Welcome, ${u.name || 'friend'}! 🐾`)
      go(u.role === 'admin' && u.mustChangePassword ? 'change-password' : 'dashboard')
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen paw-grain">
      <AppHeader go={go} />
      <div className="container mx-auto flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-xl border-2">
          <CardHeader className="text-center">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary text-primary-foreground grid place-items-center mb-2"><PawPrint className="h-7 w-7"/></div>
            <CardTitle className="font-display text-3xl">{mode === 'login' ? 'Welcome back' : 'Create your account'}</CardTitle>
            <CardDescription>{mode === 'login' ? 'Sign in to continue training your good boy/girl.' : 'Free to start. Upgrade anytime.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mode === 'register' && <div><Label>Your name (optional)</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Jane"/></div>}
            <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={e=>e.key==='Enter' && submit()}/></div>
            <div><Label>Password</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="6+ chars" onKeyDown={e=>e.key==='Enter' && submit()}/></div>
            <Button onClick={submit} disabled={busy} className="w-full rounded-full mt-3">
              {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
            <div className="text-center text-sm text-muted-foreground pt-2">
              {mode === 'login' ? <>No account? <button onClick={()=>go('register')} className="text-primary font-semibold hover:underline">Sign up</button></>
                : <>Have an account? <button onClick={()=>go('login')} className="text-primary font-semibold hover:underline">Sign in</button></>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ChangePasswordPage({ go }) {
  const { user, refresh } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (next.length < 6) return toast.error('New password must be 6+ chars')
    setBusy(true)
    try {
      await api('/auth/change-password', { method:'POST', body: JSON.stringify({ currentPassword: current, newPassword: next }) })
      await refresh()
      toast.success('Password updated')
      go(user?.role === 'admin' ? 'admin' : 'dashboard')
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="min-h-screen paw-grain">
      <AppHeader go={go}/>
      <div className="container mx-auto flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md rounded-2xl shadow-xl border-2">
          <CardHeader>
            <CardTitle className="font-display text-2xl flex items-center gap-2"><Lock className="h-5 w-5 text-primary"/>Change password</CardTitle>
            <CardDescription>{user?.mustChangePassword ? 'For security, please change your default admin password.' : 'Update your password.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!user?.mustChangePassword && <div><Label>Current password</Label><Input type="password" value={current} onChange={e=>setCurrent(e.target.value)}/></div>}
            <div><Label>New password</Label><Input type="password" value={next} onChange={e=>setNext(e.target.value)} placeholder="6+ chars"/></div>
            <Button onClick={submit} disabled={busy} className="w-full rounded-full">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Update password'}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =================================================================
// PRICING
// =================================================================
function PricingPage({ go }) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const checkout = async (planKey) => {
    if (!user) { go('register'); return }
    setBusy(planKey)
    try {
      const r = await api('/payments/checkout', { method:'POST', body: JSON.stringify({ plan: planKey, originUrl: window.location.origin }) })
      window.location.href = r.url
    } catch (e) { toast.error(e.message); setBusy(null) }
  }

  const tiers = [
    {
      key: 'free', name: 'Free', price: '$0', cycle: 'forever',
      desc: 'Try PawPlan AI with your dog.',
      features: ['2 AI plans / month','30 chat messages / day','Progress tracking & streaks','Multi-dog profiles','Curated training tips'],
      cta: user ? 'Your current plan' : 'Get started free',
      ctaAction: () => go(user ? 'dashboard' : 'register'),
      disabled: user?.tier === 'free',
      highlight: false,
    },
    {
      key: 'monthly', name: 'Premium Monthly', price: '$12.99', cycle: '/ month',
      desc: 'Unlimited AI for your dog.',
      features: ['Unlimited AI plans','Unlimited PawCoach chat','Advanced plan refinement','Priority recipe tools','Cancel anytime'],
      cta: user?.tier === 'premium' ? 'Add a month' : 'Upgrade monthly',
      ctaAction: () => checkout('monthly'),
      highlight: false,
    },
    {
      key: 'yearly', name: 'Premium Yearly', price: '$109', cycle: '/ year',
      desc: 'Best value — 2 months free.',
      features: ['Everything in Monthly','Save ~$47/year','Priority support','Yearly progress report'],
      cta: user?.tier === 'premium' ? 'Add a year' : 'Upgrade yearly',
      ctaAction: () => checkout('yearly'),
      highlight: true, badge: 'Best value',
    },
  ]

  return (
    <div className="min-h-screen paw-grain">
      <AppHeader go={go}/>
      <div className="container mx-auto py-12 px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="rounded-full bg-accent text-accent-foreground border-0 mb-3">Pricing</Badge>
          <h1 className="font-display text-5xl font-extrabold">Simple, dog-friendly pricing</h1>
          <p className="mt-3 text-muted-foreground text-lg">Start free. Upgrade when you want unlimited PawCoach.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map(t => (
            <Card key={t.key} className={`rounded-2xl relative ${t.highlight ? 'border-2 border-primary shadow-2xl shadow-primary/20 scale-105 z-10 bg-gradient-to-br from-card to-amber-50' : 'border-2'}`}>
              {t.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge className="rounded-full bg-primary text-primary-foreground px-3"><Crown className="h-3 w-3 mr-1"/>{t.badge}</Badge></div>}
              <CardHeader>
                <CardTitle className="font-display text-2xl">{t.name}</CardTitle>
                <CardDescription>{t.desc}</CardDescription>
                <div className="pt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-extrabold">{t.price}</span>
                  <span className="text-muted-foreground text-sm">{t.cycle}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {t.features.map((f,i)=>(<li key={i} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0"/>{f}</li>))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button onClick={t.ctaAction} disabled={t.disabled || busy === t.key} className={`w-full rounded-full ${t.highlight ? '' : ''}`} variant={t.highlight ? 'default' : 'outline'}>
                  {busy === t.key ? <Loader2 className="h-4 w-4 animate-spin"/> : t.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center text-xs text-muted-foreground mt-8">Test mode — no real charges. Powered by Stripe.</div>
      </div>
    </div>
  )
}

// =================================================================
// PAYMENT POLLING (after redirect from Stripe)
// =================================================================
function PaymentReturnHandler({ go }) {
  const [status, setStatus] = useState('checking')
  const [details, setDetails] = useState(null)
  const { refresh } = useAuth()

  useEffect(() => {
    const url = new URL(window.location.href)
    const sid = url.searchParams.get('session_id')
    const cancel = url.searchParams.get('payment') === 'cancel'
    if (cancel) { setStatus('cancelled'); return }
    if (!sid) { setStatus('error'); return }

    let attempts = 0, max = 8
    const poll = async () => {
      try {
        const r = await api(`/payments/status/${sid}`)
        setDetails(r)
        if (r.payment_status === 'paid') {
          setStatus('paid')
          await refresh()
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname)
          return
        }
        if (r.status === 'expired') { setStatus('expired'); return }
        if (++attempts >= max) { setStatus('timeout'); return }
        setTimeout(poll, 2000)
      } catch (e) { setStatus('error'); setDetails({ error: e.message }) }
    }
    poll()
  }, [])

  return (
    <div className="min-h-screen paw-grain">
      <AppHeader go={go}/>
      <div className="container mx-auto py-16 px-4 flex justify-center">
        <Card className="w-full max-w-md rounded-2xl shadow-xl border-2">
          <CardHeader className="text-center">
            {status === 'checking' && <><Loader2 className="h-12 w-12 mx-auto text-primary animate-spin"/><CardTitle className="mt-2 font-display text-2xl">Confirming your payment...</CardTitle><CardDescription>This usually takes just a moment.</CardDescription></>}
            {status === 'paid' && <><div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 grid place-items-center"><Check className="h-8 w-8 text-emerald-600"/></div><CardTitle className="mt-2 font-display text-2xl">You're Premium! 🎉</CardTitle><CardDescription>Thanks for supporting PawPlan AI.</CardDescription></>}
            {status === 'cancelled' && <><div className="h-14 w-14 mx-auto rounded-full bg-amber-100 grid place-items-center"><X className="h-8 w-8 text-amber-600"/></div><CardTitle className="mt-2 font-display text-2xl">Payment cancelled</CardTitle><CardDescription>No worries — you can upgrade anytime.</CardDescription></>}
            {(status === 'error' || status === 'timeout' || status === 'expired') && <><div className="h-14 w-14 mx-auto rounded-full bg-destructive/10 grid place-items-center"><X className="h-8 w-8 text-destructive"/></div><CardTitle className="mt-2 font-display text-2xl">Couldn't confirm</CardTitle><CardDescription>{details?.error || 'Please try again.'}</CardDescription></>}
          </CardHeader>
          <CardFooter className="flex gap-2">
            <Button variant="outline" onClick={()=>go('pricing')} className="flex-1">Pricing</Button>
            <Button onClick={()=>go('dashboard')} className="flex-1">Go to dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// =================================================================
// ACCOUNT
// =================================================================
function AccountPage({ go }) {
  const { user, refresh } = useAuth()
  const [txns, setTxns] = useState([])
  useEffect(() => { api('/payments/history').then(setTxns).catch(()=>{}) }, [])
  if (!user) return null
  const sub = user.subscription || {}
  const isPremium = user.tier === 'premium'

  const cancelAuto = async () => {
    await api('/payments/cancel', { method:'POST' })
    toast.success('Auto-renew turned off (current period continues)')
    refresh()
  }
  const openPortal = async () => {
    try {
      const r = await api('/payments/portal', { method:'POST', body: JSON.stringify({ originUrl: window.location.origin }) })
      window.location.href = r.url
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader go={go}/>
      <div className="container mx-auto py-10 px-4 max-w-3xl space-y-5">
        <h1 className="font-display text-4xl font-extrabold">Account</h1>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><User className="h-5 w-5"/>Profile</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><div className="text-sm mt-1">{user.name || '—'}</div></div>
            <div><Label>Email</Label><div className="text-sm mt-1">{user.email}</div></div>
            <div><Label>Role</Label><div className="text-sm mt-1 capitalize">{user.role}</div></div>
            <div><Label>Member since</Label><div className="text-sm mt-1">{new Date(user.createdAt).toLocaleDateString()}</div></div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={()=>go('change-password')}><Lock className="h-4 w-4 mr-2"/>Change password</Button>
          </CardFooter>
        </Card>

        <Card className={`rounded-2xl ${isPremium ? 'border-2 border-primary' : ''}`}>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              {isPremium ? <Crown className="h-5 w-5 text-amber-500"/> : <CreditCard className="h-5 w-5"/>}
              Subscription
            </CardTitle>
            <CardDescription>
              {isPremium ? <>You're on <b>Premium {sub.plan}</b>. {sub.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on {(sub.currentPeriodEnd || sub.expiresAt) ? new Date(sub.currentPeriodEnd || sub.expiresAt).toLocaleDateString() : '—'}. {sub.status && <Badge variant="outline" className="ml-1 rounded-full">{sub.status}</Badge>}</> : 'You are on the Free plan.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={()=>go('pricing')} className="rounded-full"><Crown className="h-4 w-4 mr-2"/>{isPremium ? 'Change plan' : 'Upgrade to Premium'}</Button>
            {isPremium && <Button variant="outline" onClick={openPortal}><CreditCard className="h-4 w-4 mr-2"/>Manage in Stripe Portal</Button>}
            {isPremium && !sub.cancelAtPeriodEnd && <Button variant="ghost" onClick={cancelAuto}>Cancel at period end</Button>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><FileText className="h-5 w-5"/>Payment history</CardTitle></CardHeader>
          <CardContent>
            {txns.length === 0 ? <div className="text-sm text-muted-foreground">No payments yet.</div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{txns.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="capitalize">{t.plan}</TableCell>
                    <TableCell>${t.amount?.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={t.paymentStatus === 'paid' ? 'default' : 'secondary'} className="rounded-full">{t.paymentStatus}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =================================================================
// ADMIN DASHBOARD
// =================================================================
function AdminPage({ go }) {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [dogs, setDogs] = useState([])
  const [plans, setPlans] = useState([])
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('/admin/stats').then(setStats),
      api('/admin/users').then(setUsers),
      api('/admin/dogs').then(setDogs),
      api('/admin/plans').then(setPlans),
      api('/admin/transactions').then(setTxns),
    ]).catch(e => toast.error(e.message)).finally(()=>setLoading(false))
  }, [])

  const removeUser = async (id) => {
    if (!confirm('Delete this user and all their data?')) return
    try { await api(`/admin/users/${id}`, { method:'DELETE' }); toast.success('Deleted'); setUsers(u => u.filter(x => x.id !== id)) } catch (e) { toast.error(e.message) }
  }

  if (user?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><Card className="p-8"><CardTitle>Forbidden</CardTitle><CardDescription>Admin only.</CardDescription></Card></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader go={go}/>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground grid place-items-center"><Shield className="h-6 w-6"/></div>
          <div>
            <h1 className="font-display text-3xl font-extrabold">Admin Dashboard</h1>
            <div className="text-sm text-muted-foreground">Logged in as {user.email}</div>
          </div>
        </div>

        {loading ? <Loader2 className="h-6 w-6 animate-spin"/> : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <StatCard icon={UsersIcon} label="Users" value={stats?.users || 0}/>
              <StatCard icon={DogIcon} label="Dogs" value={stats?.dogs || 0}/>
              <StatCard icon={ListChecks} label="Plans generated" value={stats?.plans || 0}/>
              <StatCard icon={Crown} label="Premium users" value={stats?.premiumUsers || 0} accent/>
              <StatCard icon={DollarSign} label="MRR (test)" value={`$${(stats?.mrr || 0).toFixed(2)}`} accent/>
            </div>

            <Tabs defaultValue="users">
              <TabsList className="rounded-full bg-muted h-11">
                <TabsTrigger value="users" className="rounded-full px-5"><UsersIcon className="h-4 w-4 mr-2"/>Users ({users.length})</TabsTrigger>
                <TabsTrigger value="dogs" className="rounded-full px-5"><DogIcon className="h-4 w-4 mr-2"/>Dogs ({dogs.length})</TabsTrigger>
                <TabsTrigger value="plans" className="rounded-full px-5"><ListChecks className="h-4 w-4 mr-2"/>Plans ({plans.length})</TabsTrigger>
                <TabsTrigger value="txns" className="rounded-full px-5"><CreditCard className="h-4 w-4 mr-2"/>Transactions ({txns.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <Card className="rounded-2xl"><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Tier</TableHead><TableHead>Joined</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>{users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>{u.name || '—'}</TableCell>
                        <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="rounded-full">{u.role}</Badge></TableCell>
                        <TableCell><Badge variant={u.tier === 'premium' ? 'default' : 'outline'} className="rounded-full">{u.tier}</Badge></TableCell>
                        <TableCell>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</TableCell>
                        <TableCell>{u.role !== 'admin' && <Button size="icon" variant="ghost" onClick={()=>removeUser(u.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="dogs" className="mt-4">
                <Card className="rounded-2xl"><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Breed</TableHead><TableHead>Age</TableHead><TableHead>Weight</TableHead><TableHead>Owner</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                    <TableBody>{dogs.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name} {d.isDemo && <Badge variant="outline" className="ml-1 rounded-full text-xs">demo</Badge>}</TableCell>
                        <TableCell>{d.breed}</TableCell>
                        <TableCell>{d.ageYears}y</TableCell>
                        <TableCell>{d.weightKg}kg</TableCell>
                        <TableCell className="text-xs">{d.ownerId?.slice(0,8)}…</TableCell>
                        <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="plans" className="mt-4">
                <Card className="rounded-2xl"><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Dog</TableHead><TableHead>Owner</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                    <TableBody>{plans.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium max-w-md truncate">{p.title || '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="rounded-full">{p.planType}</Badge></TableCell>
                        <TableCell className="text-xs">{p.dogId?.slice(0,12)}</TableCell>
                        <TableCell className="text-xs">{p.ownerId?.slice(0,8)}…</TableCell>
                        <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>

              <TabsContent value="txns" className="mt-4">
                <Card className="rounded-2xl"><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Session</TableHead><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                    <TableBody>{txns.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-mono">{t.sessionId?.slice(0,16)}…</TableCell>
                        <TableCell className="text-xs">{t.userId?.slice(0,8)}…</TableCell>
                        <TableCell className="capitalize">{t.plan}</TableCell>
                        <TableCell>${t.amount?.toFixed(2)}</TableCell>
                        <TableCell><Badge variant={t.paymentStatus === 'paid' ? 'default' : 'secondary'} className="rounded-full">{t.paymentStatus}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(t.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <Card className={`rounded-2xl ${accent ? 'bg-gradient-to-br from-primary/5 to-amber-50 border-primary/20' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
            <div className="font-display text-3xl font-extrabold mt-1">{value}</div>
          </div>
          <div className={`h-10 w-10 rounded-xl grid place-items-center ${accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}><Icon className="h-5 w-5"/></div>
        </div>
      </CardContent>
    </Card>
  )
}

// =================================================================
// DOG AVATAR (with photo upload)
// =================================================================
function DogAvatar({ dog, onUploaded }) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)
  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('purpose', 'dog-avatar')
      fd.append('dogId', dog.id)
      const res = await fetch('/api/upload', { method:'POST', body: fd, credentials:'include' })
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed')
      toast.success('Photo updated!')
      onUploaded?.()
    } catch (e) { toast.error(e.message) } finally { setBusy(false); if (inputRef.current) inputRef.current.value = '' }
  }
  return (
    <div className="relative group">
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <button onClick={() => inputRef.current?.click()} disabled={busy}
        className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg overflow-hidden hover:opacity-90 transition-opacity">
        {dog.photoFileId
          ? <img key={dog.photoFileId} src={`/api/files/${dog.photoFileId}/download?t=${dog.id}`} alt={dog.name} className="h-full w-full object-cover"/>
          : <DogIcon className="h-8 w-8"/>
        }
        {busy && <div className="absolute inset-0 bg-black/40 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-white"/></div>}
      </button>
      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border-2 border-primary grid place-items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <Camera className="h-3 w-3 text-primary"/>
      </div>
    </div>
  )
}

// =================================================================
// DOG FORM (re-used)
// =================================================================
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
      const dog = await api('/dogs', { method:'POST', body: JSON.stringify({
        ...form,
        allergies: form.allergies.split(',').map(s=>s.trim()).filter(Boolean),
        behaviorIssues: form.behaviorIssues.split(',').map(s=>s.trim()).filter(Boolean),
        goals: form.goals.split(',').map(s=>s.trim()).filter(Boolean),
      }) })
      toast.success(`${dog.name} added!`)
      onCreated(dog); onOpenChange(false)
      setForm({ name:'', breed:'', ageYears:1, weightKg:10, activityLevel:'moderate', allergies:'', behaviorIssues:'', goals:'', notes:'' })
    } catch (e) { toast.error(e.message) } finally { setBusy(false) }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">Add your dog</DialogTitle><DialogDescription>The more PawCoach knows, the better the plan.</DialogDescription></DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Buddy"/></div>
            <div><Label>Breed</Label><Input value={form.breed} onChange={e=>setForm({...form, breed:e.target.value})} placeholder="Golden Retriever"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Age (years)</Label><Input type="number" min="0" step="0.5" value={form.ageYears} onChange={e=>setForm({...form, ageYears:e.target.value})}/></div>
            <div><Label>Weight (kg)</Label><Input type="number" min="0" step="0.5" value={form.weightKg} onChange={e=>setForm({...form, weightKg:e.target.value})}/></div>
          </div>
          <div><Label>Activity level</Label>
            <Select value={form.activityLevel} onValueChange={v=>setForm({...form, activityLevel:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>{ACTIVITY_LEVELS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Allergies <span className="text-xs text-muted-foreground">(comma separated)</span></Label><Input value={form.allergies} onChange={e=>setForm({...form, allergies:e.target.value})} placeholder="chicken, wheat"/></div>
          <div><Label>Behavior issues</Label><Input value={form.behaviorIssues} onChange={e=>setForm({...form, behaviorIssues:e.target.value})} placeholder="pulls on leash, barks at strangers"/></div>
          <div><Label>Goals</Label><Input value={form.goals} onChange={e=>setForm({...form, goals:e.target.value})} placeholder="off-leash recall, weight loss"/></div>
          <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} rows={2} placeholder="Loves water, food motivated..."/></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : <>Add dog</>}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =================================================================
// PLAN VIEW
// =================================================================
function Stat({ label, value }) {
  return <div className="rounded-xl bg-muted/40 p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-xl font-display font-bold">{value}</div></div>
}

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
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><Dumbbell className="h-5 w-5 text-primary"/> Training</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {(p.training.phases||[]).map((ph,i) => (
                <Card key={i} className="rounded-xl">
                  <CardHeader className="pb-2">
                    <div className="text-xs text-muted-foreground">{ph.weekRange}</div>
                    <CardTitle className="text-lg font-display">{ph.focus}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="list-disc pl-5 space-y-1">{(ph.goals||[]).map((g,j)=><li key={j}>{g}</li>)}</ul>
                    <Separator/>
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
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><Salad className="h-5 w-5 text-emerald-600"/> Nutrition</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <Stat label="Daily kcal" value={p.nutrition.dailyCalories}/>
              <Stat label="Meals/day" value={p.nutrition.mealsPerDay}/>
              <Stat label="Hydration" value={`${p.nutrition.hydrationMl} ml`}/>
              <Stat label="Treats" value={(p.nutrition.treats||[]).length}/>
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
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><ShoppingBag className="h-5 w-5 text-primary"/> Shopping list</h4>
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
            <h4 className="font-display text-xl font-bold flex items-center gap-2 mb-3"><Trophy className="h-5 w-5 text-amber-500"/> Milestones</h4>
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

// =================================================================
// CHAT
// =================================================================
function PawCoachChat({ dog, onLimit }) {
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

  useEffect(() => { api(`/chat/${sessionId}`).then(setMessages).catch(()=>{}) }, [sessionId])
  useEffect(() => { scrollRef.current?.scrollTo({ top: 999999, behavior:'smooth' }) }, [messages, busy])

  const send = async () => {
    if (!input.trim() || busy) return
    const text = input.trim(); setInput('')
    setMessages(m => [...m, { id:'temp-'+Date.now(), role:'user', content:text, createdAt:new Date() }])
    setBusy(true)
    try {
      const res = await api('/chat', { method:'POST', body: JSON.stringify({ dogId: dog.id, sessionId, message: text }) })
      setMessages(m => [...m, res.message])
    } catch (e) {
      if (e.status === 402) { onLimit?.('chat'); toast.error('Daily chat limit reached. Upgrade for unlimited.') }
      else toast.error(e.message)
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
          <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-primary-foreground"><PawPrint className="h-5 w-5"/></AvatarFallback></Avatar>
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
        <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=> e.key==='Enter' && send()} placeholder={`Ask about ${dog.name}...`} disabled={busy}/>
        <Button onClick={send} disabled={busy || !input.trim()} className="rounded-full"><Send className="h-4 w-4"/></Button>
      </div>
    </Card>
  )
}

// =================================================================
// PROGRESS
// =================================================================
function ProgressTab({ dog, onLimit }) {
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
      await api('/plans/adjust', { method:'POST', body: JSON.stringify({ dogId: dog.id, feedback }) })
      toast.success('Plan refined! Check the Plan tab.')
      setFeedback('')
    } catch (e) {
      if (e.status === 402) { onLimit?.('plan'); toast.error('Plan limit reached. Upgrade for unlimited.') }
      else toast.error(e.message)
    } finally { setRefining(false) }
  }

  const chartData = useMemo(() => entries.map(e => ({
    date: new Date(e.createdAt).toLocaleDateString(undefined, { month:'short', day:'numeric' }),
    weight: e.weightKg || null, rating: e.rating || null, duration: e.durationMin || 0,
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
            <Stat label="Streak" value={`${streak}d 🔥`}/>
            <Stat label="Total minutes" value={totalMin}/>
            <Stat label="Avg rating" value={avgRating}/>
          </div>
          <div className="h-56">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                  <ReTooltip contentStyle={{ borderRadius:12, border:'1px solid hsl(var(--border))' }}/>
                  <Line type="monotone" dataKey="rating" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r:3 }} name="Rating"/>
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r:3 }} name="Weight (kg)"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-sm text-muted-foreground">Log a session to see progress charts.</div>}
          </div>
          <Separator className="my-5"/>
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
            <div><Label>Type</Label>
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
              <div><Label>Duration (min)</Label><Input type="number" value={form.durationMin} onChange={e=>setForm({...form, durationMin:e.target.value})}/></div>
              <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={form.weightKg} onChange={e=>setForm({...form, weightKg:e.target.value})} placeholder="optional"/></div>
            </div>
            <div><Label>How did it go? (1-5)</Label>
              <div className="flex gap-2 mt-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={()=>setForm({...form, rating:n})} className={`h-9 w-9 rounded-full text-sm font-semibold ${form.rating>=n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} placeholder={`What happened with ${dog.name}?`}/></div>
            <Button onClick={submit} disabled={busy} className="w-full rounded-full">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Log it'}</Button>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-primary/30 bg-primary/5">
          <CardHeader><CardTitle className="font-display flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary"/> Refine plan</CardTitle><CardDescription>Tell PawCoach what to change. It rewrites the plan.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder={`E.g. ${dog.name} loved the recall game. The morning meal was too much — make portions smaller.`}/>
            <Button onClick={refine} disabled={refining} className="w-full rounded-full">
              {refining ? <><Loader2 className="h-4 w-4 animate-spin mr-2"/>Refining...</> : <><Sparkles className="h-4 w-4 mr-2"/>Refine my plan</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// =================================================================
// USAGE BANNER
// =================================================================
function UsageBanner({ usage, go }) {
  if (!usage || usage.tier === 'premium') return null
  const plansPct = Math.min(100, (usage.plans.used / usage.plans.limit) * 100)
  const chatsPct = Math.min(100, (usage.chats.used / usage.chats.limit) * 100)
  return (
    <Card className="rounded-2xl bg-gradient-to-br from-amber-50 to-primary/10 border-2 border-primary/20 mb-4">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 grid sm:grid-cols-2 gap-3 w-full">
          <div>
            <div className="text-xs text-muted-foreground flex items-center justify-between"><span>AI plans this month</span><span className="font-semibold">{usage.plans.used} / {usage.plans.limit}</span></div>
            <ProgressBar value={plansPct} className="h-1.5 mt-1"/>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center justify-between"><span>Chats today</span><span className="font-semibold">{usage.chats.used} / {usage.chats.limit}</span></div>
            <ProgressBar value={chatsPct} className="h-1.5 mt-1"/>
          </div>
        </div>
        <Button onClick={()=>go('pricing')} className="rounded-full shadow-md"><Crown className="h-4 w-4 mr-2"/>Upgrade</Button>
      </CardContent>
    </Card>
  )
}

// =================================================================
// DASHBOARD
// =================================================================
function Dashboard({ go }) {
  const { user } = useAuth()
  const [dogs, setDogs] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [plans, setPlans] = useState([])
  const [usage, setUsage] = useState(null)
  const [openForm, setOpenForm] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [planType, setPlanType] = useState('combined')
  const [tab, setTab] = useState('plan')
  const active = dogs.find(d => d.id === activeId)

  const refreshUsage = () => api('/usage').then(setUsage).catch(()=>{})
  const refreshDogs = async () => {
    const list = await api('/dogs')
    setDogs(list)
    if (!activeId && list.length) setActiveId(list[0].id)
  }
  useEffect(() => { refreshDogs(); refreshUsage() }, [])
  useEffect(() => { if (activeId) api(`/plans?dogId=${activeId}`).then(setPlans).catch(()=>{}) }, [activeId, generating])

  const generate = async () => {
    if (!active) return
    setGenerating(true)
    try {
      const newPlan = await api('/plans/generate', { method:'POST', body: JSON.stringify({ dogId: active.id, planType }) })
      toast.success('Plan ready!')
      setPlans(p => [newPlan, ...p]); setTab('plan'); refreshUsage()
    } catch (e) {
      if (e.status === 402) { go('pricing'); toast.error('Monthly plan limit reached. Upgrade for unlimited.') }
      else toast.error(e.message)
    } finally { setGenerating(false) }
  }
  const removeDog = async (id) => {
    if (!confirm('Delete this dog and all their data?')) return
    await api(`/dogs/${id}`, { method:'DELETE' }); toast.success('Removed')
    if (activeId === id) setActiveId(null); refreshDogs()
  }
  const latestPlan = plans[0]

  return (
    <div className="min-h-screen bg-background">
      <AppHeader go={go}/>
      <div className="flex">
        <aside className="w-72 border-r min-h-[calc(100vh-4rem)] p-5 sticky top-16 hidden lg:block">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your dogs</div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={()=>setOpenForm(true)}><Plus className="h-4 w-4"/></Button>
          </div>
          <div className="space-y-1">
            {dogs.map(d => (
              <button key={d.id} onClick={()=>setActiveId(d.id)} className={`w-full text-left rounded-xl p-3 flex items-center gap-3 group transition-colors ${activeId===d.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'}`}>
                <Avatar className="h-9 w-9">
                  {d.photoFileId
                    ? <img src={`/api/files/${d.photoFileId}/download`} alt={d.name} className="h-full w-full object-cover"/>
                    : <AvatarFallback className="bg-amber-100 text-amber-700"><DogIcon className="h-4 w-4"/></AvatarFallback>
                  }
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-1">{d.name} {d.isDemo && <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">demo</Badge>}</div>
                  <div className="text-xs text-muted-foreground truncate">{d.breed}</div>
                </div>
                {!d.isDemo && d.ownerId === user?.id && (
                  <span onClick={(e)=>{e.stopPropagation(); removeDog(d.id)}} className="opacity-0 group-hover:opacity-100 hover:text-destructive cursor-pointer"><Trash2 className="h-3.5 w-3.5"/></span>
                )}
              </button>
            ))}
          </div>
          <Button onClick={()=>setOpenForm(true)} variant="outline" className="w-full mt-3 rounded-full"><Plus className="h-4 w-4 mr-2"/>Add dog</Button>
        </aside>

        <main className="flex-1 p-6 lg:p-8 max-w-6xl">
          <div className="lg:hidden mb-4">
            <Select value={activeId || ''} onValueChange={setActiveId}>
              <SelectTrigger><SelectValue placeholder="Choose a dog..."/></SelectTrigger>
              <SelectContent>{dogs.map(d => <SelectItem key={d.id} value={d.id}>{d.name} — {d.breed}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <UsageBanner usage={usage} go={go}/>

          {!active ? (
            <Card className="rounded-2xl"><CardContent className="p-12 text-center">
              <DogIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3"/>
              <div className="font-display text-xl font-bold mb-1">Add your first dog</div>
              <div className="text-muted-foreground mb-4">Tell PawCoach about them to get a custom plan.</div>
              <Button onClick={()=>setOpenForm(true)}><Plus className="h-4 w-4 mr-1"/>Add dog</Button>
            </CardContent></Card>
          ) : (
            <>
              <div className="rounded-3xl border-2 bg-gradient-to-br from-primary/10 via-amber-100/40 to-emerald-100/30 p-6 mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <DogAvatar dog={active} onUploaded={refreshDogs}/>
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
                    <Card className="rounded-2xl border-2 border-dashed mb-4 border-primary/40 bg-primary/5"><CardContent className="p-6 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><PawPrint className="h-5 w-5 wag"/></div>
                      <div><div className="font-display font-bold">PawCoach is crafting {active.name}'s plan…</div><div className="text-sm text-muted-foreground">Analyzing breed, weight, allergies, goals and recent progress.</div></div>
                    </CardContent></Card>
                  )}
                  {latestPlan ? <PlanCard plan={latestPlan}/> : (
                    <Card className="rounded-2xl border-dashed border-2"><CardContent className="p-12 text-center">
                      <Wand2 className="h-10 w-10 mx-auto text-muted-foreground mb-2"/>
                      <div className="font-display text-xl font-bold mb-1">No plan yet</div>
                      <div className="text-muted-foreground mb-4">Click Generate plan to get a custom 4-week plan for {active.name}.</div>
                    </CardContent></Card>
                  )}
                </TabsContent>
                <TabsContent value="coach" className="mt-5"><PawCoachChat dog={active} onLimit={()=>go('pricing')}/></TabsContent>
                <TabsContent value="progress" className="mt-5"><ProgressTab dog={active} onLimit={()=>go('pricing')}/></TabsContent>
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

// =================================================================
// APP SHELL
// =================================================================
function AppInner() {
  // initial view based on URL params (payment redirect)
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('payment') || p.get('session_id')) return 'payment-return'
    }
    return 'home'
  })
  const { user, loading } = useAuth()

  // Force admin password change on first login
  useEffect(() => {
    if (user?.mustChangePassword && view !== 'change-password') setView('change-password')
  }, [user, view])

  // Seed admin & demo on first load
  useEffect(() => { api('/seed', { method:'POST' }).catch(()=>{}) }, [])

  const go = (v) => {
    if (v === 'dashboard' && !user) return setView('login')
    if (v === 'admin' && user?.role !== 'admin') return setView('home')
    setView(v)
  }

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>

  if (view === 'home') return <Landing go={go}/>
  if (view === 'login') return <AuthCard go={go} mode="login"/>
  if (view === 'register') return <AuthCard go={go} mode="register"/>
  if (view === 'change-password') return <ChangePasswordPage go={go}/>
  if (view === 'pricing') return <PricingPage go={go}/>
  if (view === 'account') return user ? <AccountPage go={go}/> : <AuthCard go={go} mode="login"/>
  if (view === 'admin') return <AdminPage go={go}/>
  if (view === 'payment-return') return <PaymentReturnHandler go={go}/>
  if (view === 'dashboard') return user ? <Dashboard go={go}/> : <AuthCard go={go} mode="login"/>
  return <Landing go={go}/>
}

function App() {
  return <AuthProvider><AppInner/></AuthProvider>
}

export default App
