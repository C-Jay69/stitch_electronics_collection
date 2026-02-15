import { Product as PrismaProduct } from "@prisma/client";

// Re-export Prisma Product as our main Product type
export type Product = PrismaProduct;

export type CartItem = Product & {
    quantity: number;
};

export type UserSettings = {
    sarcasmLevel: 'low' | 'medium' | 'high' | 'nuclear';
    monthlyLimit: number;
    currentSplurge: number;
};
