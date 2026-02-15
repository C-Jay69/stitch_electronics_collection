import prisma from "@/lib/prisma";
import ProductView from "@/components/features/ProductView";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    notFound();
  }

  // Find if this product has a dupe (isDupe=false, so find a product where dupeOfId = this.id)
  // OR if this product IS a dupe, display its parent? No, usually show the cheap one on expensive page.
  
  let dupe = null;
  if (!product.isDupe) {
      dupe = await prisma.product.findFirst({
          where: { dupeOfId: product.id }
      });
  }

  return <ProductView product={product} dupe={dupe} />;
}
