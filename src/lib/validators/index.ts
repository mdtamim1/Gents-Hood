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
  shippingPhone: z.string().refine((val) => {
    const clean = val.replace(/[^\d]/g, '');
    const normalized = clean.startsWith('8801') && clean.length === 13 ? clean.slice(2) : clean;
    return /^01[3-9]\d{8}$/.test(normalized);
  }, 'Please enter a valid Bangladeshi mobile number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX)'),
  shippingDistrict: z.string().min(2, 'District is required'),
  shippingThana: z.string().optional(),
  shippingArea: z.string().optional(),
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
  galleryStrip: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        image: z.string(),
      })
    )
    .optional(),
});

export type SiteSettingInput = z.infer<typeof siteSettingSchema>;

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  subject: z.string().min(2, 'Subject must be at least 2 characters').max(150),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  turnstileToken: z.string().optional(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const newsletterSubscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address to join the Hood'),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
