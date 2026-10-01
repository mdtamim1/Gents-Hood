import { db } from '@/lib/db';

export interface SubscriberRecord {
  id: string;
  email: string;
  active: boolean | number;
  createdAt: string | Date;
}

export async function findSubscriberByEmail(email: string): Promise<SubscriberRecord | null> {
  const subscriber = await db.subscriber.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  return subscriber;
}

export async function createOrReactivateSubscriber(email: string): Promise<{ isNew: boolean }> {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await findSubscriberByEmail(cleanEmail);

  if (existing) {
    if (!existing.active) {
      await db.subscriber.update({
        where: { id: existing.id },
        data: { active: true },
      });
    }
    return { isNew: false };
  }

  await db.subscriber.create({
    data: {
      email: cleanEmail,
      active: true,
    },
  });

  return { isNew: true };
}
