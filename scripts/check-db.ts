import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.product.count()
    console.log(`There are ${count} products in the database.`)
    if (count > 0) {
        const first = await prisma.product.findFirst()
        console.log('First product:', first?.name)
    }
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
