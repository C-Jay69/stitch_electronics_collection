import { Navbar } from "@/components/layout/Navbar";
import { MateWidget } from "@/components/features/MateWidget";

export default function ShopLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Navbar />
            <main className="pt-20 pb-24 max-w-7xl mx-auto px-6">
                {children}
            </main>
            <MateWidget />
        </>
    );
}
