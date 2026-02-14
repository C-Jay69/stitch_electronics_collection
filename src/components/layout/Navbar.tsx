"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ShoppingCart, Menu, User } from "lucide-react";
import { useStore } from "@/store";

export const Navbar = () => {
    const cartCount = useStore((state) => state.cart.length);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    {/* Fallback to text if logo image is missing, but prioritize image */}
                    <div className="relative w-10 h-10 overflow-hidden rounded-md">
                        <Image
                            src="/logo.png"
                            alt="Shopaholics Inc Logo"
                            fill
                            className="object-contain"
                            onError={(e) => {
                                // Hide image on error (optional implementation detail, for now just basic render)
                                // In a real app we'd toggle state to show icon instead
                            }}
                        />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
                        Shopaholics<span className="text-purple-500">.</span>
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/shop" className="text-sm font-medium text-slate-500 hover:text-white transition-colors hidden md:block">
                        Shop
                    </Link>
                    <Link href="/about" className="text-sm font-medium text-slate-500 hover:text-white transition-colors hidden md:block">
                        Our "Mission"
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ShoppingCart className="w-6 h-6" />
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                        )}
                    </Link>
                    <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </nav>
    );
};
