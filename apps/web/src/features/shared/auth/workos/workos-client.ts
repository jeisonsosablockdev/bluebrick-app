/**
 * WorkOS AuthKit OAuth & Social Login Client
 */

export interface WorkosUserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export function isWorkosConfigured(): boolean {
  return Boolean(process.env.WORKOS_API_KEY && process.env.WORKOS_CLIENT_ID);
}
