import { z } from 'zod';

export const createOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  shippingName: z.string().min(2, 'Full name must be at least 2 characters'),
  shippingPhone: z
    .string()
    .regex(/^(?:\+?88|01)?\d{11}$/, 'Please enter a valid 11-digit Bangladeshi mobile number'),
  shippingDistrict: z.string().min(2, 'District is required'),
  shippingArea: z.string().min(2, 'Area or Thana is required'),
  shippingAddress: z.string().min(5, 'Full street address is required'),
  note: z.string().max(500).optional(),
  items: z.array(createOrderItemSchema).min(1, 'At least one item is required'),
  idempotencyKey: z.string().min(8, 'Idempotency key is required'),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD', 'CARD']).default('COD'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;

export const siteSettingSchema = z.object({
  announcementText: z.string().optional(),
  freeDeliveryMin: z.number().int().nonnegative().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  heroTagline: z.string().optional(),
  heroBackgroundWord: z.string().optional(),
  deliveryCharges: z
    .object({
      insideDhaka: z.number().int().nonnegative(),
      outsideDhaka: z.number().int().nonnegative(),
    })
    .optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional().or(z.literal('')),
      instagram: z.string().url().optional().or(z.literal('')),
      tiktok: z.string().url().optional().or(z.literal('')),
      youtube: z.string().url().optional().or(z.literal('')),
      whatsapp: z.string().optional().or(z.literal('')),
      messenger: z.string().optional().or(z.literal('')),
    })
    .optional(),
});

export type SiteSettingInput = z.infer<typeof siteSettingSchema>;
