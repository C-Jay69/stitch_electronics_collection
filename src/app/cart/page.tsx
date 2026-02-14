"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Trash2, Minus, Plus, Brain, Timer, ShoppingCart } from "lucide-react";
import { useStore } from "@/store";

export default function CartPage() {
    const { cart, removeFromCart } = useStore();

    // Mock data for display if cart is empty, to match the design
    const displayItems = cart.length > 0 ? cart : [
        {
            id: "1",
            name: "CloudWalker Elite",
            price: 349.00,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDivtYzABENaIIZbmq2wRj8I54vokgBxVmPnWRS0EfrBEEC_yl6Ea-TtrbfOSVOox_A90yzXR4Ne-z8qT5I6zj4kY6CIaHcS7QH76SYPJeC5X7fH9yj27jkA1ct1QjL4Cr3cEhQPhWAfn4zLuhE1lma8j804GQ2bbZwnEMhI1jXkAOubcUU4toZBK1KRiDWCdlphOOw7GAgmZq4QiKIBFGBi4iG6WlF7vIZxTnt1QagPqy8HqMCUKwDwdphYuC12cfpEbalmgedsFs",
            quantity: 1,
            category: "Shoes"
        },
        {
            id: "2",
            name: "Obsidian Timepiece",
            price: 1250.00,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRTZptKyA_Xg6srN7UrElo1DpaWG8dJRgAZPA80cjT865GFC_IkrZHduKo3lL1gepGzjZEHqRs2y11hGcwIxKGUfpHlfZtj2V4ChocwLxBz-94YKIpwxA9kzNpI0y0hLfHFAmOGJ2e66YHrJEX9TEVKqi9smV61xjGBlx8UFG-_83pQSdZBa_XKRwVEzhTM5j6Um7ZGFzElEVuUUUK9prgZXaJsEoadNEupDObY98zbKM0iPvFsrtUYwsXBme-DD07iT3dB6U0oT8",
            quantity: 1,
            category: "Watches"
        }
    ];

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Top App Bar */}
            <div className="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between">
                <Link href="/" className="flex size-10 shrink-0 items-center justify-start text-slate-900 dark:text-white">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">My Regrets</h2>
                <div className="flex size-10 items-center justify-end">
                    <MoreHorizontal className="w-6 h-6 cursor-pointer" />
                </div>
            </div>

            <div className="flex flex-col px-4 pt-6 pb-32">
                {/* Witty Header */}
                <h1 className="text-2xl font-bold leading-tight tracking-tight mb-8">
                    Cart’s heavier than a Sunday roast—sure you need it all?
                </h1>

                {/* Cart Items */}
                <div className="space-y-6 mb-10">
                    {displayItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4">
                            <div className="relative aspect-square size-24 shrink-0 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-white/10">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <div className="flex flex-col flex-1 gap-1">
                                <div className="flex justify-between items-start">
                                    <p className="text-base font-bold leading-tight line-clamp-1">{item.name}</p>
                                    <Trash2 className="w-5 h-5 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-red-500 transition-colors" />
                                </div>
                                <p className="text-primary text-sm font-semibold">${item.price.toFixed(2)}</p>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-white/5 rounded-full px-3 py-1">
                                        <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-xs">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                        <button className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-xs">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Shopaholics Anonymous Intervention */}
                <div className="bg-primary/10 dark:bg-primary/5 border border-primary/30 rounded-xl p-5 mb-10">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold leading-tight tracking-tight">Shopaholics Anonymous Mate</h3>
                    </div>
                    <div className="space-y-4">
                        {/* Intervention 1: Timer */}
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium opacity-80">Thinking of impulse buying the watch? Let’s sleep on it for 30 mins.</p>
                            <div className="flex items-center gap-3 bg-white dark:bg-surface-dark rounded-lg p-3 border border-primary/20">
                                <Timer className="text-primary w-5 h-5" />
                                <div className="flex-1">
                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-2/3"></div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold font-mono">20:00</span>
                            </div>
                        </div>
                        <div className="h-px bg-primary/20"></div>
                        {/* Intervention 2: Dupe */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-sm font-medium opacity-80 mb-1">Our records show you’re not a billionaire. Try this instead?</p>
                                <p className="text-xs font-bold text-primary uppercase tracking-wider">The "I have bills" Dupe • $45.00</p>
                            </div>
                            <div className="relative aspect-square size-14 rounded-lg overflow-hidden border border-primary/30">
                                <Image
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhC5PXVcdTA4rtiJrsDdEN9BXG7TOb7RF8WqHPP2GEObF51FNC2bmNj5SDRlE4RtFjHwsSkL5Fh4gG8BF35aqsyDlo7eSVvMFy7YtOGF41zxpAzx0SN4R1nyIsFUwhOsChFC9alM1vvSSc1b6UEWm4VLBia1XID5RcipBhBCskwCGC1y7S1xLPRN-Te6423079war65LI-ohHmuRpYALEcjk-aCuGRssv_yOqjmJY7AGeX-nLPzLBefTIGmQbbODNgzM_-vhC8KDI"
                                    alt="Dupe Watch"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Summary */}
                <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-sm">
                        <span className="opacity-60">Subtotal (2 items)</span>
                        <span className="font-medium">$1,599.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="opacity-60">Shipping (Instant Gratification)</span>
                        <span className="font-medium text-green-500">FREE</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="opacity-60">Guilt Tax</span>
                        <span className="font-medium">$0.00</span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex justify-between items-end">
                        <span className="text-lg font-bold">Total Damage</span>
                        <div className="text-right">
                            <span class="text-2xl font-bold">$1,599.00</span>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Payment will hurt briefly</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Checkout Button Container */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light dark:via-background-dark to-transparent pt-8">
                <button className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group active:scale-[0.98] transition-transform bg-gradient-to-r from-primary to-purple-600 hover:brightness-110">
                    <span>Proceed to Checkout (if you must)</span>
                    <ShoppingCart className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
