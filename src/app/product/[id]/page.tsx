"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Verified, ArrowRight, Heart, Star, StarHalf } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/store";

export default function ProductPage({ params }: { params: { id: string } }) {
    // In a real app, fetch product by ID. using mock data.
    const { addToCart } = useStore();
    const [activeImage, setActiveImage] = useState(0);

    const product = {
        id: "3",
        name: "The 'I'm Richer Than You' Tote",
        price: 2450.00,
        description: "Crafted from the tears of unicorns and premium Italian calfskin. This bag says \"I have a hedge fund\" without you having to open your mouth. Space for your ego and maybe a phone.",
        images: [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAVCDotvH-D-iE8YlGmLXxES8s4OdZS5XTKGI73TkssaSrEBn5No6RI2I_bXom8d614i9Kuium-teicKpRPEIx_WlDWYImnYZtBzZDpIRTLI7sohsCNkQRIGVwHb2uRdRSKy7SKEvEDqehqnqAS4uyDK44NrvgMXROOHM_yadinWBuELdrjfK5lCr-vgpIxb3tqOoIonDGGyaOvfLXXPcU-ixq_-ykWaPo5ctR4GYBzCPhaiavdF_oyAthwsKDpIjaRuulPvpjJQcs",
            // Mock additional images
        ],
        dupe: {
            name: "Eco-Canvas Tote",
            price: 35.00,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIvBTkyhoR0IdhdTZMnuFZrFpDoSzBYXYMDaQR8nHbb4Tp7rjhGZlJ1a78zrpyL1eoPgSX209rP2VAosLbOaV0eOElQbIBJlWkaoNZLBn-5S-RjWFOQoakZ6lqhL52CF9vZj-FNmPKkHekEQWs2B9VGSUDX9VWchmYYs9JowWSSzuXEiqSGFrqHgbvrqomylOxVP8ZnA0KA2WWAu6WHC3dDzvGx9vWSyTP2NYx6-KVIujGUqvPXnzq12Xmw3hCrSQhxIhskR-22d8"
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen pb-32">
            {/* Mobile Header (Hidden on Desktop usually, but keeping consistent with legacy) */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-white/10 md:hidden">
                <Link href="/" className="flex items-center justify-center size-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-bold tracking-tight">Shopaholics Inc.</h1>
                <Link href="/cart" className="flex items-center justify-center size-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10">
                    <ShoppingBag className="w-5 h-5" />
                </Link>
            </header>

            <main className="max-w-4xl mx-auto md:py-10 md:px-6">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Image Gallery Hero */}
                    <section className="relative group rounded-2xl overflow-hidden bg-gray-100 dark:bg-surface-dark">
                        <div className="aspect-[3/4] overflow-hidden relative">
                            <Image
                                src={product.images[activeImage] || product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>

                        {/* Mate's Nudge Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-white/10 dark:bg-[#271834]/90 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl">
                                <div className="flex items-start gap-4">
                                    <div className="size-14 rounded-lg bg-gray-300 dark:bg-white/10 overflow-hidden flex-shrink-0 border border-white/10 relative">
                                        <Image
                                            src={product.dupe.image}
                                            alt={product.dupe.name}
                                            fill
                                            className="object-cover opacity-80"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Verified className="w-4 h-4 text-primary" />
                                            <p className="text-[10px] font-bold tracking-widest uppercase text-primary">Mate's Nudge</p>
                                        </div>
                                        <p className="text-sm font-medium leading-tight text-white/90">Psst, check this cheaper alternative ({product.dupe.price}) before you commit!</p>
                                        <button className="mt-2 flex items-center gap-1 text-xs font-bold text-white group-hover:gap-2 transition-all">
                                            VIEW DUPE <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Product Details */}
                    <section className="p-6 md:p-0">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-3xl font-bold leading-tight max-w-[80%]">{product.name}</h2>
                            <button className="p-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-50">
                                <Heart className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-2xl font-bold text-primary mb-6">${product.price.toFixed(2)}</p>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                            {product.description}
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3 block">Pick a Hue</label>
                                <div className="flex gap-3">
                                    <button className="size-10 rounded-full border-2 border-primary bg-black ring-offset-2 dark:ring-offset-background-dark ring-2 ring-primary"></button>
                                    <button className="size-10 rounded-full bg-amber-900 border-2 border-transparent"></button>
                                    <button className="size-10 rounded-full bg-slate-300 border-2 border-transparent"></button>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Add to Cart */}
                        <button
                            onClick={() => addToCart({ ...product, image: product.images[0], category: 'Accessories' })}
                            className="hidden md:flex w-full mt-8 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl items-center justify-center gap-2 transition-all"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            ADD TO CART
                        </button>
                    </section>
                </div>

                {/* Technical Specs & Reviews sections could go here */}
            </main>

            {/* Mobile Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 inset-x-0 p-6 bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-50 md:hidden">
                <button
                    onClick={() => addToCart({ ...product, image: product.images[0], category: 'Accessories' })}
                    className="w-full bg-gradient-to-r from-primary to-[#7c3aed] text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                    <ShoppingBag className="w-5 h-5" />
                    ADD TO CART
                </button>
            </div>
        </div>
    );
}
