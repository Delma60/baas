// frontend/lib/api/auth-settings-client.ts
/**
 * Server-side helpers for per-project auth settings, email templates,
 * and SMTP configuration. Calls FastAPI /internal/* endpoints.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class AuthSettingsApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function internalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${FASTAPI_BASE_URL}/internal${path}`;
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      msg = b?.detail ?? b?.error?.message ?? msg;
    } catch {}
    throw new AuthSettingsApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from_name: string;
  from_email: string;
  secure: boolean;
}

export interface AuthProviders {
  email: boolean;
  phone: boolean;
  magic_link: boolean;
  google: boolean;
  github: boolean;
}

export interface AuthSettings {
  allow_signups: boolean;
  require_email_verification: boolean;
  allow_multiple_sessions: boolean;
  min_password_length: number;
  session_duration_hours: number;
  providers: AuthProviders;
  smtp: SmtpConfig;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

export type EmailTemplates = Record<string, EmailTemplate>;

export async function getAuthSettings(projectId: string): Promise<AuthSettings> {
  return internalFetch<AuthSettings>(`/projects/${projectId}/auth/settings`);
}

export async function getEmailTemplates(projectId: string): Promise<EmailTemplates> {
  return internalFetch<EmailTemplates>(`/projects/${projectId}/auth/templates`);
}