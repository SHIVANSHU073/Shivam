import { storage } from '@/src/utils/storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = 'clutch_jwt';

async function getToken(): Promise<string | null> {
  return (await storage.secureGet<string>(TOKEN_KEY, '')) || null;
}

export async function setToken(token: string) {
  await storage.secureSet(TOKEN_KEY, token);
}

export async function clearToken() {
  await storage.secureRemove(TOKEN_KEY);
}

export async function apiFetch<T = any>(
  path: string,
  options: { method?: string; body?: any; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = await getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }
  if (!res.ok) {
    const err: any = new Error(data?.detail || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const api = {
  // Auth
  signup: (b: any) => apiFetch('/auth/signup', { method: 'POST', body: b, auth: false }),
  login: (b: any) => apiFetch('/auth/login', { method: 'POST', body: b, auth: false }),
  otpSend: (b: any) => apiFetch('/auth/otp/send', { method: 'POST', body: b, auth: false }),
  otpVerify: (b: any) => apiFetch('/auth/otp/verify', { method: 'POST', body: b, auth: false }),
  googleSession: (b: any) => apiFetch('/auth/google/session', { method: 'POST', body: b, auth: false }),
  me: () => apiFetch('/auth/me'),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  // Profile
  updateProfile: (b: any) => apiFetch('/profile', { method: 'PATCH', body: b }),
  // KYC
  kycSubmit: (b: any) => apiFetch('/kyc/submit', { method: 'POST', body: b }),
  kycStatus: () => apiFetch('/kyc/status'),
  // Wallet
  wallet: () => apiFetch('/wallet'),
  deposit: (amount: number) => apiFetch('/wallet/deposit', { method: 'POST', body: { amount, method: 'razorpay' } }),
  withdraw: (b: any) => apiFetch('/wallet/withdraw', { method: 'POST', body: b }),
  transactions: () => apiFetch('/wallet/transactions'),
  // Tournaments
  tournaments: (q: Record<string, string> = {}) => {
    const qs = new URLSearchParams(q).toString();
    return apiFetch(`/tournaments${qs ? `?${qs}` : ''}`, { auth: false });
  },
  tournament: (id: string) => apiFetch(`/tournaments/${id}`),
  register: (b: any) => apiFetch('/tournaments/register', { method: 'POST', body: b }),
  myTournaments: () => apiFetch('/my/tournaments'),
  // Results
  uploadResult: (b: any) => apiFetch('/results', { method: 'POST', body: b }),
  myResults: () => apiFetch('/results/my'),
  // Leaderboard
  leaderboard: (period: string) => apiFetch(`/leaderboard?period=${period}`, { auth: false }),
  // Referral
  referral: () => apiFetch('/referral'),
  // Support
  ticketCreate: (b: any) => apiFetch('/support/tickets', { method: 'POST', body: b }),
  ticketsList: () => apiFetch('/support/tickets'),
  // Notifications
  notifications: () => apiFetch('/notifications'),
  readAll: () => apiFetch('/notifications/read-all', { method: 'POST' }),
  // Banners
  banners: () => apiFetch('/banners', { auth: false }),
  // Admin
  adminStats: () => apiFetch('/admin/stats'),
  adminUsers: (q = '') => apiFetch(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  adminWithdrawals: (status = 'pending') => apiFetch(`/admin/withdrawals?status=${status}`),
  adminWithdrawalAction: (b: any) => apiFetch('/admin/withdrawals/action', { method: 'POST', body: b }),
  adminKyc: (status = 'pending') => apiFetch(`/admin/kyc?status=${status}`),
  adminKycAction: (b: any) => apiFetch('/admin/kyc/action', { method: 'POST', body: b }),
  adminResults: (status = 'pending') => apiFetch(`/admin/results?status=${status}`),
  adminResultAction: (b: any) => apiFetch('/admin/results/action', { method: 'POST', body: b }),
  adminCreateTournament: (b: any) => apiFetch('/admin/tournaments', { method: 'POST', body: b }),
  adminUpdateTournament: (id: string, b: any) => apiFetch(`/admin/tournaments/${id}`, { method: 'PATCH', body: b }),
  adminNotify: (b: any) => apiFetch('/admin/notify', { method: 'POST', body: b }),
  teams: () => apiFetch('/teams'),
  teamCreate: (b: any) => apiFetch('/teams', { method: 'POST', body: b }),
  teamJoin: (b: any) => apiFetch('/teams/join', { method: 'POST', body: b }),
};

export { getToken };
