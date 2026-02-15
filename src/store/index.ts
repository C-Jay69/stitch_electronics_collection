import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, UserSettings } from '@/lib/types';

interface AppState {
    cart: CartItem[];
    settings: UserSettings;
    isMateActive: boolean;
    addToCart: (product: Product) => Promise<void>;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    toggleMate: () => void;
    updateSettings: (settings: Partial<UserSettings>) => void;
    initCart: () => Promise<void>; // New action to sync with API
}

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            cart: [],
            settings: {
                sarcasmLevel: 'medium',
                monthlyLimit: 500,
                currentSplurge: 0,
            },
            isMateActive: true,

            initCart: async () => {
                try {
                    const res = await fetch('/api/cart');
                    if (res.ok) {
                        const data = await res.json();
                        // If API has items, use them. If not, keep local (or merge? Simplification: API wins if logged in)
                        if (data.items && data.items.length > 0) {
                            set({ cart: data.items });
                        }
                    }
                } catch (e) {
                    console.error("Failed to init cart", e);
                }
            },

            addToCart: async (product) => {
                set((state) => {
                    const existing = state.cart.find((item) => item.id === product.id);
                    if (existing) {
                        return {
                            cart: state.cart.map((item) =>
                                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                            ),
                            settings: { ...state.settings, currentSplurge: state.settings.currentSplurge + product.price }
                        };
                    }
                    return {
                        cart: [...state.cart, { ...product, quantity: 1 }],
                        settings: { ...state.settings, currentSplurge: state.settings.currentSplurge + product.price }
                    };
                });

                // Sync with API
                try {
                    await fetch('/api/cart', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ productId: product.id, quantity: 1 })
                    });
                } catch (e) {
                    // Ignore for now (guest users)
                }
            },

            removeFromCart: (productId) =>
                set((state) => ({
                    cart: state.cart.filter((item) => item.id !== productId),
                })),

            updateQuantity: (productId, quantity) =>
                set((state) => ({
                    cart: state.cart.map((item) =>
                        item.id === productId ? { ...item, quantity } : item
                    ),
                })),

            updateSettings: (newSettings) =>
                set((state) => ({ settings: { ...state.settings, ...newSettings } })),

            toggleMate: () => set((state) => ({ isMateActive: !state.isMateActive })),
        }),
        {
            name: 'shopaholics-storage',
        }
    )
);
