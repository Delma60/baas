// sdk/js/src/modules/auth.ts

import { BaseFetch } from "../utils/fetch";
import type {
  AuthSession,
  AuthUser,
  SignUpOptions,
  SignInOptions,
} from "../types/index";

type SessionChangeListener = (session: AuthSession | null) => void;

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface SignUpResponseData {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
}

interface SignInResponseData {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
}

interface RefreshResponseData {
  access_token: string;
  refresh_token?: string | null;
  token_type: string;
}

interface MeResponseData {
  id: string;
  email: string;
  name?: string | null;
  is_email_verified: boolean;
  created_at: string;
}

// ─── AuthModule ───────────────────────────────────────────────────────────────

export class AuthModule {
  private http: BaseFetch;
  private projectId: string;
  private _session: AuthSession | null = null;
  private _listeners: Set<SessionChangeListener> = new Set();

  constructor(http: BaseFetch, projectId: string) {
    this.http = http;
    this.projectId = projectId;
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Create a new user account.
   * Automatically signs the user in and updates the session.
   */
  async signUp(options: SignUpOptions): Promise<AuthSession> {
    const res = await this.http.post<SignUpResponseData>(
      `/v1/auth/${this.projectId}/signup`,
      {
        email: options.email,
        password: options.password,
        name: options.name,
      }
    );

    const session = this._buildSession(res.data);
    this._setSession(session);
    return session;
  }

  /**
   * Sign in with email and password.
   * Updates the session and notifies all listeners.
   */
  async signIn(options: SignInOptions): Promise<AuthSession> {
    const res = await this.http.post<SignInResponseData>(
      `/v1/auth/${this.projectId}/signin`,
      {
        email: options.email,
        password: options.password,
      }
    );

    const session = this._buildSession(res.data);
    this._setSession(session);
    return session;
  }

  /**
   * Sign out the current user.
   * Clears the session and notifies all listeners.
   */
  async signOut(): Promise<void> {
    try {
      await this.http.post(`/v1/auth/${this.projectId}/signout`);
    } finally {
      // Always clear locally even if the server call fails
      this._setSession(null);
    }
  }

  /**
   * Exchange a refresh token for a new access token.
   * Updates the current session in-place.
   */
  async refresh(refreshToken?: string): Promise<AuthSession> {
    const token = refreshToken ?? this._session?.refreshToken;
    if (!token) {
      throw new Error("No refresh token available. Please sign in again.");
    }

    const res = await this.http.post<RefreshResponseData>(
      `/v1/auth/${this.projectId}/refresh`,
      { refresh_token: token }
    );

    const updated: AuthSession = {
      user: this._session?.user ?? { id: "", email: "" },
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token ?? null,
      tokenType: res.data.token_type,
    };

    this._setSession(updated);
    return updated;
  }

  /**
   * Fetch the currently authenticated user's profile from the server.
   * Requires an active session.
   */
  async me(): Promise<AuthUser> {
    const res = await this.http.get<MeResponseData>(
      `/v1/auth/${this.projectId}/me`
    );

    const user = this._mapUser(res.data);

    // Keep the session user in sync
    if (this._session) {
      this._setSession({ ...this._session, user });
    }

    return user;
  }

  /**
   * Subscribe to session changes (sign-in, sign-out, token refresh).
   * Returns an unsubscribe function.
   *
   * @example
   * const unsub = baas.auth.onSessionChange((session) => {
   *   if (session) console.log("signed in as", session.user.email);
   *   else console.log("signed out");
   * });
   * unsub(); // stop listening
   */
  onSessionChange(listener: SessionChangeListener): () => void {
    this._listeners.add(listener);
    // Immediately call with the current session so the caller can initialise
    listener(this._session);
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * Returns the current session, or null if not signed in.
   */
  getSession(): AuthSession | null {
    return this._session;
  }

  /**
   * Returns true if there is an active session.
   */
  isAuthenticated(): boolean {
    return this._session !== null;
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  private _buildSession(
    data: SignUpResponseData | SignInResponseData
  ): AuthSession {
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? null,
      },
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? null,
      tokenType: data.token_type,
    };
  }

  private _mapUser(data: MeResponseData): AuthUser {
    return {
      id: data.id,
      email: data.email,
      name: data.name ?? null,
      isEmailVerified: data.is_email_verified,
      createdAt: data.created_at,
    };
  }

  private _setSession(session: AuthSession | null): void {
    this._session = session;

    // Tell the HTTP layer about the new user token so subsequent requests
    // automatically include the X-User-Token header
    this.http.setUserToken(session?.accessToken);

    this._notifyListeners(session);
  }

  private _notifyListeners(session: AuthSession | null): void {
    for (const listener of this._listeners) {
      try {
        listener(session);
      } catch {
        // Never let a listener crash the SDK
      }
    }
  }

  /**
   * Manually inject a session (e.g. restored from localStorage by the app).
   * Triggers session-change listeners.
   */
  setSession(session: AuthSession | null): void {
    this._setSession(session);
  }
}