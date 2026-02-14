import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, Users, Menu } from "lucide-react";

export default function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-card-dark">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <LayoutDashboard className="text-primary w-6 h-6" />
                        Shopaholics
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Admin Command Center</p>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {[
                        { name: "Overview", icon: LayoutDashboard, href: "/admin" },
                        { name: "Products", icon: Package, href: "/admin/products" },
                        { name: "Orders", icon: ShoppingCart, href: "/admin/orders" },
                        { name: "Customers", icon: Users, href: "/admin/customers" },
                        { name: "Analytics", icon: BarChart3, href: "/admin/analytics" },
                        { name: "Settings", icon: Settings, href: "/admin/settings" },
                    ].map((item) => (
                        <Link key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary rounded-xl transition-colors">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
                            <Image
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHPp8hNmE16F5z3UhUYMotYsAmLY8VEE1EW0dqwcfH74s87tTUMQ5puBooZHodzlVW-MDgzdqHhwx2H0sQA7MtsTmukMYXMf-nerZ3Mg50lXh0h41c5HMgOeHQswQ87Z_-nYxu40xIOOtZDikMW23vF8O8lxh7Id49nrjZVwHXMWOfgNMmn9t3v__JgTd7Va_6TcHpCP3X2KH1uO2VcIPCcjArGLy_juT1fYs0dzlnHrjXuThE13tQxxOg-UcSVRvu2755badIlac"
                                alt="Admin"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Admin</p>
                            <p className="text-xs text-slate-500">Master of Coin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <header className="md:hidden sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Menu className="w-6 h-6 text-slate-500" />
                        <span className="font-bold text-slate-900 dark:text-white">Shopaholics Admin</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
                        <Image
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHPp8hNmE16F5z3UhUYMotYsAmLY8VEE1EW0dqwcfH74s87tTUMQ5puBooZHodzlVW-MDgzdqHhwx2H0sQA7MtsTmukMYXMf-nerZ3Mg50lXh0h41c5HMgOeHQswQ87Z_-nYxu40xIOOtZDikMW23vF8O8lxh7Id49nrjZVwHXMWOfgNMmn9t3v__JgTd7Va_6TcHpCP3X2KH1uO2VcIPCcjArGLy_juT1fYs0dzlnHrjXuThE13tQxxOg-UcSVRvu2755badIlac"
                            alt="Admin"
                            fill
                            className="object-cover"
                        />
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
