// Authentication helpers for admin session
export interface AdminSession {
  id: string;
  email: string;
  role: 'OWNER' | 'STAFF';
}

export async function getAdminSession(): Promise<AdminSession | null> {
  // To be implemented in Phase 7
  return null;
}
