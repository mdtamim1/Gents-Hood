import { db } from '@/lib/db';
import type { CustomerInquiry } from '@prisma/client';

export interface CreateInquiryInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  ipAddress?: string;
}

export interface InquiryFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Automatically purge inquiries that have passed their 7-day expiration date
 */
export async function purgeExpiredInquiries(): Promise<number> {
  try {
    const result = await db.customerInquiry.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch (error) {
    console.error('[PURGE_INQUIRIES_ERROR]', error);
    return 0;
  }
}

/**
 * Create a new customer inquiry with an exact 7-day TTL expiration
 */
export async function createInquiry(input: CreateInquiryInput): Promise<CustomerInquiry> {
  // Purge any expired ones opportunistically
  await purgeExpiredInquiries();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from creation

  return db.customerInquiry.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone ? input.phone.trim() : null,
      subject: input.subject.trim(),
      message: input.message.trim(),
      ipAddress: input.ipAddress || null,
      status: 'NEW',
      createdAt: now,
      expiresAt,
    },
  });
}

/**
 * Get inquiries list with filtering, searching, and pagination
 */
export async function getInquiries(params?: InquiryFilterParams) {
  // Automatically purge expired inquiries before fetching
  await purgeExpiredInquiries();

  const status = params?.status && params.status !== 'ALL' ? params.status : undefined;
  const search = params?.search?.trim() || undefined;
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 25));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { message: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [inquiries, total, newCount, reviewedCount, resolvedCount] = await Promise.all([
    db.customerInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.customerInquiry.count({ where }),
    db.customerInquiry.count({ where: { status: 'NEW' } }),
    db.customerInquiry.count({ where: { status: 'REVIEWED' } }),
    db.customerInquiry.count({ where: { status: 'RESOLVED' } }),
  ]);

  return {
    inquiries,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    counts: {
      total: newCount + reviewedCount + resolvedCount,
      new: newCount,
      reviewed: reviewedCount,
      resolved: resolvedCount,
    },
  };
}

/**
 * Get inquiry stats for badge counts in sidebar
 */
export async function getInquiryStats() {
  await purgeExpiredInquiries();

  const [newCount, total] = await Promise.all([
    db.customerInquiry.count({ where: { status: 'NEW' } }),
    db.customerInquiry.count(),
  ]);

  return { newCount, total };
}

/**
 * Update inquiry status and optional notes
 */
export async function updateInquiryStatus(
  id: string,
  status: 'NEW' | 'REVIEWED' | 'RESOLVED',
  adminNotes?: string
) {
  return db.customerInquiry.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === 'RESOLVED' ? new Date() : null,
      adminNotes: adminNotes !== undefined ? adminNotes : undefined,
    },
  });
}

/**
 * Manually delete an inquiry
 */
export async function deleteInquiry(id: string) {
  return db.customerInquiry.delete({
    where: { id },
  });
}
