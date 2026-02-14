import { DollarSign, Users, TrendingUp, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Message */}
            <div>
                <h2 className="text-2xl font-bold leading-tight tracking-tight">
                    Congrats, you’re basically running <span className="text-primary underline decoration-primary/30">Amazon</span> now.
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fueling addictions for 12,500+ active enablers today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat Card 1 */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <DollarSign className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="p-2 bg-primary/10 rounded-lg text-primary">
                                <DollarSign className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Splurges</p>
                        <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">$4.2M</h3>
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Users className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <Users className="w-5 h-5" />
                            </span>
                            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+5.2%</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Shoppers</p>
                        <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">12.5K</h3>
                    </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden md:col-span-2">
                    <div className="flex items-center justify-between h-full">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Impulse Coach Success Rate</p>
                            <h3 className="text-4xl font-bold text-slate-900 dark:text-white">84.2%</h3>
                            <p className="text-xs text-slate-500 mt-2">People we successfully shamed into saving money.</p>
                        </div>
                        <div className="h-20 w-20 relative flex items-center justify-center">
                            {/* Placeholder for circular chart */}
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-white/10"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent border-l-transparent rotate-45"></div>
                            <span className="text-sm font-bold text-primary">84%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity / Dupes */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-white/5 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg">Top Dupes Selected</h3>
                        <button className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all">
                            VIEW REPORT <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: "Cloud Runners", original: "Luxury Walkers", saved: "120k", count: "4.2k" },
                            { name: "TimeKeeper v2", original: "Pear Watch Ultra", saved: "340k", count: "1.8k" },
                        ].map((dupe, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-white/5">
                                <div>
                                    <p className="font-bold text-sm text-slate-900 dark:text-white">{dupe.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Dupe for {dupe.original}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-primary">Saved ${dupe.saved}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{dupe.count} purchases</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
