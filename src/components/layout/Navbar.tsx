import { useSession, signIn, signOut } from "next-auth/react";

export const Navbar = () => {
    const { data: session } = useSession();
    const { cart, initCart } = useStore();

    // Sync cart on login
    // eslint-disable-next-line react-hooks/exhaustive-deps
    import { useEffect } from "react";
    useEffect(() => {
        if (session?.user) {
            initCart();
        }
    }, [session]);

    const cartCount = cart.length;

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
                    {session?.user && (
                        <Link href="/admin" className="text-sm font-medium text-slate-500 hover:text-white transition-colors hidden md:block">
                            Admin
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {session ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                    {session.user?.name?.[0] || "U"}
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="text-xs font-bold text-red-400 hover:text-red-300"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn()}
                            className="text-sm font-bold text-primary hover:text-white transition-colors"
                        >
                            Sign In
                        </button>
                    )}

                    <Link href="/cart" className="relative p-2 hover:bg-whitte/5 rounded-full transition-colors">
                        <ShoppingCart className="w-6 h-6" />
                        {cartCount > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
};
