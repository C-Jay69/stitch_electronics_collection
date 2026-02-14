import { create } from 'zustand';
import { CartItem, Product, UserSettings } from '@/lib/types';

interface AppState {
    cart: CartItem[];
    settings: UserSettings;
    isMateActive: boolean;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateSettings: (settings: Partial<UserSettings>) => void;
    toggleMate: () => void;
}

export const useStore = create<AppState>((set) => ({
    cart: [],
    settings: {
        sarcasmLevel: 'medium',
        monthlyLimit: 500,
        currentSplurge: 0,
    },
    isMateActive: true,
    addToCart: (product) =>
        set((state) => {
            const existing = state.cart.find((item) => item.id === product.id);
            if (existing) {
                return {
                    cart: state.cart.map((item) =>
                        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                    ),
                    settings: {
                        ...state.settings,
                        currentSplurge: state.settings.currentSplurge + product.price,
                    },
                };
            }
            return {
                cart: [...state.cart, { ...product, quantity: 1 }],
                settings: {
                    ...state.settings,
                    currentSplurge: state.settings.currentSplurge + product.price,
                },
            };
        }),
    removeFromCart: (productId) =>
        set((state) => ({
            cart: state.cart.filter((item) => item.id !== productId),
        })),
    updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
    toggleMate: () => set((state) => ({ isMateActive: !state.isMateActive })),
}));
