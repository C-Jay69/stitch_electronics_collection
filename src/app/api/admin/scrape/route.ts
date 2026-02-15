import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import puppeteer from "puppeteer";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // Basic auth check (in real app, check for admin role)
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const browser = await puppeteer.launch({
            headless: true, // "new" is deprecated, true is the new default or use "new" if older version
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Set user agent to avoid being blocked immediately
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Heuristic scraping
        const data = await page.evaluate(() => {
            const title = document.querySelector('h1')?.innerText || document.title;

            // Try to find price
            // simple regex to find currency symbol followed by numbers
            const priceRegex = /[$€£¥]\s*\d+([.,]\d{2})?/;
            const prices: number[] = [];

            // Scan all text nodes or elements
            // This is very naive. In a real scraper, we'd use specific selectors per site.
            document.querySelectorAll('*').forEach(el => {
                if (el.children.length === 0 && el.textContent) {
                    const match = el.textContent.match(priceRegex);
                    if (match) {
                        try {
                            const p = parseFloat(match[0].replace(/[^0-9.]/g, ''));
                            if (!isNaN(p)) prices.push(p);
                        } catch (e) { }
                    }
                }
            });

            // Guessing the price is usually the largest font size or first one found?
            // Let's Just take the first one that looks "reasonable" or the max one?
            // Actually, usually the main price is prominent.
            const price = prices.length > 0 ? prices[0] : 0;

            // Image: find the largest image
            let maxArea = 0;
            let mainImage = "";
            document.querySelectorAll('img').forEach(img => {
                const rect = img.getBoundingClientRect();
                const area = rect.width * rect.height;
                if (area > maxArea && img.src.startsWith('http')) {
                    maxArea = area;
                    mainImage = img.src;
                }
            });

            return { title, price, image: mainImage, description: "Scraped from " + document.location.hostname };
        });

        await browser.close();

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error("Scraping failed:", error);
        return NextResponse.json({ error: "Scraping failed", details: String(error) }, { status: 500 });
    }
}
