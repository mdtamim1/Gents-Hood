import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ProductForm } from '../../ProductForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { position: 'asc' } },
      variants: true,
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <ProductForm
        initialData={{
          ...product,
          variants: product.variants.map((v) => ({
            id: v.id,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex,
            stock: v.stock,
            sku: v.sku,
          })),
        }}
        isEdit
      />
    </div>
  );
}
