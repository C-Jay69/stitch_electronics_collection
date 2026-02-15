import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { context, data } = await req.json();

    // In a real implementation, this would call OpenAI/Gemini
    // For now, we have a "Rules-Based Sarcasm Engine" (RBSE)

    let message = "Buy it. You need it. Probably.";

    if (context === "cart_view") {
        const total = data?.total || 0;
        if (total > 500) {
            const responses = [
                "Oh, look at you, Big Spender. Do you even have rent money?",
                "Five hundred dollars? I hope that comes with a therapy session.",
                "Your wallet is crying right now. Can you hear it?",
                "I'm sure this purchase will fill the void. (Spoiler: It won't.)"
            ];
            message = responses[Math.floor(Math.random() * responses.length)];
        } else if (total > 100) {
            const responses = [
                "Responsible-ish. Boring, but responsible.",
                "Are you sure you don't want the more expensive one?",
                "A modest splurge. How... quaint."
            ];
            message = responses[Math.floor(Math.random() * responses.length)];
        } else {
            message = "You're barely even trying to ruin your finances. Disappointing.";
        }
    } else if (context === "product_view") {
        if (data?.price > 1000) {
            message = "This costs more than your first car. Just saying.";
        } else if (data?.isDupe) {
            message = "Ah, the 'I have a budget' choice. Smart. Nobody will know.";
        } else {
            message = "It's shiny. You like shiny things, don't you?";
        }
    }

    return NextResponse.json({ message });
}
