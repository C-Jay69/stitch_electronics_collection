import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// Import standard puppeteer for local dev
import puppeteer from "puppeteer";
// Import core and chromium for production (verified availability)
import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    // Basic auth check
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        let browser;

        if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
            // Production: Use puppeteer-core + @sparticuz/chromium
            browser = await puppeteerCore.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: Number(chromium.headless) === 1 ? true : false,
            });
        } else {
            // Local: Use full puppeteer
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Heuristic scraping
        const data = await page.evaluate(() => {
            const title = document.querySelector('h1')?.innerText || document.title;

            const priceRegex = /[$€£¥]\s*\d+([.,]\d{2})?/;
            const prices: number[] = [];

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

            const price = prices.length > 0 ? prices[0] : 0;

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
