import type { Formation } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchFormations(search = '', offset = 0, limit = 20): Promise<Formation[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (offset > 0) params.append('offset', offset.toString());
  if (limit !== 20) params.append('limit', limit.toString());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE}/formations${queryString}`);
  if (!response.ok) {
    throw new Error('Failed to fetch formations');
  }
  return response.json();
}

export async function createFormation(
  name: string,
  code: string,
  publisher: string,
  turnstileToken?: string | null
): Promise<Formation> {

  const response = await fetch(`${API_BASE}/formations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name.toUpperCase(),
      code,
      publisher,
      turnstileToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to create formation');
  }

  return response.json();
}

export async function checkFormationExists(name: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/formations/check?name=${encodeURIComponent(name.toUpperCase())}`);
  if (!response.ok) {
    throw new Error('Failed to check formation');
  }
  const data = await response.json();
  return data.exists;
}
