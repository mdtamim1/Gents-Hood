import { Product, ProductImage, ProductVariant, Order, OrderItem } from '@prisma/client';

export type ProductWithRelations = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
};

export type OrderWithRelations = Order & {
  items: OrderItem[];
};

export interface CartItemType {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
}
