import type { RoleLogin } from '../types';

const PROXY_ENDPOINT = '/.netlify/functions/role-logins';

type FetchResponse = {
  data: RoleLogin[];
};

type InsertResponse = {
  roleId: string;
  loginAt: string;
};

const parseError = async (response: Response): Promise<never> => {
  let details: string | undefined;

  try {
    const payload = await response.json();
    if (payload && typeof payload === 'object') {
      details = typeof payload.details === 'string' ? payload.details : payload.message;
    }
  } catch (error) {
    // Ignore JSON parsing errors and fallback to status text
  }

  const reason = details ?? response.statusText;
  throw new Error(`Role login proxy request failed (${response.status}): ${reason}`);
};

export const logRoleLogin = async (roleId: string, loginAt?: string): Promise<InsertResponse> => {
  const response = await fetch(PROXY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ roleId, loginAt }),
  });

  if (!response.ok) {
    await parseError(response);
  }

  const payload = (await response.json()) as InsertResponse;
  return payload;
};

export const fetchRoleLoginsSince = async (startIso: string): Promise<RoleLogin[]> => {
  const response = await fetch(`${PROXY_ENDPOINT}?startIso=${encodeURIComponent(startIso)}`);
  if (!response.ok) {
    await parseError(response);
  }

  const payload = (await response.json()) as FetchResponse;
  return payload.data ?? [];
};
