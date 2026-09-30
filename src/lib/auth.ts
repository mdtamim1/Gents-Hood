import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'STAFF';
  sessionToken?: string;
}

export const ADMIN_COOKIE_NAME = 'gh_admin_session';

const getJwtSecret = () => {
  const secret = process.env.AUTH_SECRET || 'gents-hood-ultra-secure-admin-secret-key-32chars';
  return new TextEncoder().encode(secret);
};

export async function signAdminToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.id || !payload.email || !payload.role) {
      return null;
    }
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) || 'Admin',
      role: payload.role as 'OWNER' | 'STAFF',
      sessionToken: payload.sessionToken as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}
