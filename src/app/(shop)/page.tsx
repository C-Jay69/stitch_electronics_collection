import Image from "next/image";
import Link from "next/link";
import { Monitor, Shirt, Home as HomeIcon, Sparkles, ShoppingBag } from "lucide-react";
import prisma from "@/lib/prisma";

export default async function Home() {
    // Fetch a featured product (e.g., the most expensive one that isn't a dupe)
    const featuredProduct = await prisma.product.findFirst({
        where: {
            isDupe: false,
            price: { gt: 1000 }
        }
    });

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="relative h-[500px] w-full rounded-3xl overflow-hidden group">
                <Image
                    src={featuredProduct?.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuAVCDotvH-D-iE8YlGmLXxES8s4OdZS5XTKGI73TkssaSrEBn5No6RI2I_bXom8d614i9Kuium-teicKpRPEIx_WlDWYImnYZtBzZDpIRTLI7sohsCNkQRIGVwHb2uRdRSKy7SKEvEDqehqnqAS4uyDK44NrvgMXROOHM_yadinWBuELdrjfK5lCr-vgpIxb3tqOoIonDGGyaOvfLXXPcU-ixq_-ykWaPo5ctR4GYBzCPhaiavdF_oyAthwsKDpIjaRuulPvpjJQcs"}
                    alt="Featured Product"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-dark/90 via-background-dark/20 to-transparent">
                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                                    Trending Now
                                </span>
                                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-white">
                                    {featuredProduct?.name || "The 'I'm Richer Than You' Tote"}
                                </h1>
                                <p className="text-lg text-gray-300 mb-6">
                                    {featuredProduct?.description || "Crafted from the tears of unicorns and premium Italian calfskin. Space for your ego and maybe a phone."}
                                </p>
                                <div className="flex items-center gap-4">
                                    <Link href={featuredProduct ? `/product/${featuredProduct.id}` : "#"}>
                                        <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
                                            SHOP NOW <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full ml-1">${featuredProduct?.price.toFixed(2) || "2,450.00"}</span>
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="text-primary w-6 h-6" />
                        Curated for your lack of self-control
                    </h2>
                    <Link href="/shop" className="text-sm font-bold text-gray-500 hover:text-white transition-colors">
                        VIEW ALL
                    </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: "Electronics", desc: "Shiny distractions.", icon: Monitor, bg: "bg-blue-500/10", text: "text-blue-500" },
                        { name: "Fashion", desc: "Wear your debt.", icon: Shirt, bg: "bg-purple-500/10", text: "text-purple-500" },
                        { name: "Home", desc: "Fill the void.", icon: HomeIcon, bg: "bg-emerald-500/10", text: "text-emerald-500" },
                        { name: "Accessories", desc: "Unnecessary things.", icon: ShoppingBag, bg: "bg-amber-500/10", text: "text-amber-500" }, // Replaced ShoppingBag here as valid import? No, ShoppingBag is from Lucide, needs import.
                    ].map((cat) => (
                        <Link href={`/category/${cat.name.toLowerCase()}`} key={cat.name} className="group p-6 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/50 transition-all hover:-translate-y-1">
                            <div className={`w-14 h-14 rounded-xl ${cat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <cat.icon className={`w-7 h-7 ${cat.text}`} />
                            </div>
                            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                            <p className="text-xs text-gray-500">{cat.desc}</p>
                        </Link>
                    ))}
                </div>

                {/* Helper for ShoppingBag icon which might be missing in imports above */}
            </section>
        </div>
    );
}
