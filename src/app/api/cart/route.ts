import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ items: [] });
    }

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            orders: {
                where: { status: 'PENDING' },
                include: { items: { include: { product: true } } }
            }
        }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Current active cart (PENDING order)
    const cart = user.orders[0];

    return NextResponse.json({
        cartId: cart?.id,
        items: cart?.items.map(item => ({
            ...item.product,
            quantity: item.quantity,
            cartItemId: item.id
        })) || []
    });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, quantity } = await req.json();

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find or create pending order
    let order = await prisma.order.findFirst({
        where: { userId: user.id, status: 'PENDING' }
    });

    if (!order) {
        order = await prisma.order.create({
            data: { userId: user.id, status: 'PENDING', total: 0 }
        });
    }

    // Add item
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Check if item exists in order
    const existingItem = await prisma.orderItem.findFirst({
        where: { orderId: order.id, productId }
    });

    if (existingItem) {
        await prisma.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity }
        });
    } else {
        await prisma.orderItem.create({
            data: {
                orderId: order.id,
                productId,
                quantity,
                price: product.price
            }
        });
    }

    return NextResponse.json({ success: true });
}
