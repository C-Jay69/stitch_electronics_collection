
// This file will hold the types for our project
export type Product = {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    category: string;
    isDupe?: boolean; // If true, this is a cheaper alternative
    originalPrice?: number; // If it's a dupe, show what it's a dupe of
};

export type CartItem = Product & {
    quantity: number;
};

export type UserSettings = {
    sarcasmLevel: 'low' | 'medium' | 'high' | 'nuclear';
    monthlyLimit: number;
    currentSplurge: number;
};
