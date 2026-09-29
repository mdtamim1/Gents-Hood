import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export interface SubscriberRecord {
  id: string;
  email: string;
  active: boolean | number;
  createdAt: string | Date;
}

export async function findSubscriberByEmail(email: string): Promise<SubscriberRecord | null> {
  const rows = (await db.$queryRawUnsafe(
    'SELECT id, email, active, createdAt FROM Subscriber WHERE email = ? LIMIT 1',
    email.toLowerCase().trim()
  )) as SubscriberRecord[];

  return rows.length > 0 ? rows[0] : null;
}

export async function createOrReactivateSubscriber(email: string): Promise<{ isNew: boolean }> {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await findSubscriberByEmail(cleanEmail);

  if (existing) {
    if (!existing.active) {
      await db.$executeRawUnsafe('UPDATE Subscriber SET active = 1 WHERE id = ?', existing.id);
    }
    return { isNew: false };
  }

  const id = `sub_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
  await db.$executeRawUnsafe(
    'INSERT INTO Subscriber (id, email, active, createdAt) VALUES (?, ?, 1, CURRENT_TIMESTAMP)',
    id,
    cleanEmail
  );

  return { isNew: true };
}
