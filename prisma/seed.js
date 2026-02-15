const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Clear existing data to avoid conflicts on re-run
    try {
        await prisma.orderItem.deleteMany()
        await prisma.order.deleteMany()
        await prisma.product.deleteMany()
        await prisma.user.deleteMany()
    } catch (e) {
        console.log('Database likely empty or tables missing, proceeding.')
    }

    // Ultra Lux Product
    const luxuryBag = await prisma.product.create({
        data: {
            name: "The 'I'm Richer Than You' Tote",
            description: "Crafted from the tears of unicorns and premium Italian calfskin. This bag says 'I have a hedge fund' without you having to open your mouth. Space for your ego and maybe a phone.",
            price: 2450.00,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVCDotvH-D-iE8YlGmLXxES8s4OdZS5XTKGI73TkssaSrEBn5No6RI2I_bXom8d614i9Kuium-teicKpRPEIx_WlDWYImnYZtBzZDpIRTLI7sohsCNkQRIGVwHb2uRdRSKy7SKEvEDqehqnqAS4uyDK44NrvgMXROOHM_yadinWBuELdrjfK5lCr-vgpIxb3tqOoIonDGGyaOvfLXXPcU-ixq_-ykWaPo5ctR4GYBzCPhaiavdF_oyAthwsKDpIjaRuulPvpjJQcs",
            category: "Bags",
            inventory: 5,
            isDupe: false,
        }
    })

    // The Dupe
    const dupeBag = await prisma.product.create({
        data: {
            name: "Eco-Canvas Tote",
            description: "It holds things. It doesn't cost a mortgage payment. It's fine.",
            price: 35.00,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIvBTkyhoR0IdhdTZMnuFZrFpDoSzBYXYMDaQR8nHbb4Tp7rjhGZlJ1a78zrpyL1eoPgSX209rP2VAosLbOaV0eOElQbIBJlWkaoNZLBn-5S-RjWFOQoakZ6lqhL52CF9vZj-FNmPKkHekEQWs2B9VGSUDX9VWchmYYs9JowWSSzuXEiqSGFrqHgbvrqomylOxVP8ZnA0KA2WWAu6WHC3dDzvGx9vWSyTP2NYx6-KVIujGUqvPXnzq12Xmw3hCrSQhxIhskR-22d8",
            category: "Bags",
            inventory: 100,
            isDupe: true,
            dupeOfId: luxuryBag.id
        }
    })

    // Another example pair
    const expensiveWatch = await prisma.product.create({
        data: {
            name: "Pear Watch Ultra",
            description: "Tells time, tracks your pulse, and judges your lifestyle choices.",
            price: 799.00,
            image: "https://placehold.co/400x400/101010/FFF?text=Pear+Watch", // Placeholder
            category: "Electronics",
            inventory: 10,
            isDupe: false
        }
    })

    const cheapWatch = await prisma.product.create({
        data: {
            name: "TimeKeeper v2",
            description: "It tells time. Sometimes it beeps.",
            price: 45.00,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCEgM0z7w2xq4Ls0VTeNP7EHU_O8sKEAfWW37L7noVnDH9bHz7EcORlExSM3oK6aKySUhm67KBYmn6rs99FFuTmyH00iv-Sa8WwQ7JVbSv-P2aNHU3A5l0DhltnpNhG963t1Oq7GnmIHKVWdbhwvl43-Tt_PiwxUsPlCYRpsfIBuH0IsEW0DDHU9Kr9rqi8m6Kb56r2uoX1AW4qnPlQPBtg7zjlFtw4n0aZccaekXZXnLNta35sP9kevI4TjRC_kVHg48AkVwL44U4",
            category: "Electronics",
            inventory: 50,
            isDupe: true,
            dupeOfId: expensiveWatch.id
        }
    })

    console.log('Seeding finished.')
    console.log({ luxuryBag, dupeBag })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
