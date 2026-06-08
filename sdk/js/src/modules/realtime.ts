// sdk/js/src/modules/realtime.ts

import { io, Socket } from "socket.io-client";
import { BaseFetch } from "../utils/fetch";
import type { RealtimeOptions, RealtimeEventType } from "../types/filters";
import type { RealtimeEvent } from "../types/index";

// ─── Internal types ───────────────────────────────────────────────────────────

type EventListener<T extends Record<string, unknown> = Record<string, unknown>> = (
  event: RealtimeEvent<T>
) => void;

interface SubscribeResponse {
  channel: string;
  resource: string;
  event_types: RealtimeEventType[];
  connection_url: string;
}

interface Subscription {
  channel: string;
  resource: string;
  listeners: Set<EventListener>;
}

// ─── RealtimeModule ───────────────────────────────────────────────────────────

export class RealtimeModule {
  private http: BaseFetch;
  private projectId: string;
  private baseUrl: string;

  /** Lazily initialised Socket.io connection */
  private socket: Socket | null = null;

  /** channel name → subscription state */
  private subscriptions = new Map<string, Subscription>();

  /** Whether connect() has been called */
  private connecting = false;

  constructor(http: BaseFetch, projectId: string, baseUrl: string) {
    this.http = http;
    this.projectId = projectId;
    this.baseUrl = baseUrl;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Subscribe to changes on a SQL table (INSERT, UPDATE, DELETE).
   * Returns an unsubscribe function — call it to stop listening.
   *
   * @example
   * const unsub = baas.realtime.on("posts", (event) => {
   *   console.log(event.type, event.record)
   * })
   * unsub() // stop listening
   *
   * @example — filter event types
   * const unsub = baas.realtime.on("posts", handler, { eventTypes: ["INSERT"] })
   */
  on<T extends Record<string, unknown> = Record<string, unknown>>(
    table: string,
    listener: EventListener<T>,
    options?: RealtimeOptions
  ): () => void {
    return this._subscribe(table, listener as EventListener, options);
  }

  /**
   * Subscribe to changes on a NoSQL collection (INSERT, UPDATE, DELETE).
   * Functionally identical to `.on()` — provided as a semantic alias.
   *
   * @example
   * const unsub = baas.realtime.onCollection("articles", (event) => {
   *   console.log(event.type, event.record)
   * })
   */
  onCollection<T extends Record<string, unknown> = Record<string, unknown>>(
    collection: string,
    listener: EventListener<T>,
    options?: RealtimeOptions
  ): () => void {
    return this._subscribe(collection, listener as EventListener, options);
  }

  /**
   * Disconnect from the realtime server and remove all listeners.
   * Call this when your app unmounts or the user signs out.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscriptions.clear();
    this.connecting = false;
  }

  /**
   * Returns true if the Socket.io connection is currently active.
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  /**
   * Core subscribe logic:
   * 1. Ask the backend for the channel name via POST /subscribe
   * 2. Ensure the Socket.io connection is open
   * 3. Join the channel and route events to listeners
   */
  private _subscribe(
    resource: string,
    listener: EventListener,
    options?: RealtimeOptions
  ): () => void {
    // Fire-and-forget async setup; return unsubscribe immediately
    this._setupSubscription(resource, listener, options).catch((err) => {
      console.error(`[YourBaaS Realtime] Failed to subscribe to "${resource}":`, err);
    });

    // Return unsubscribe — works even before the async setup completes
    return () => this._removeListener(resource, listener);
  }

  private async _setupSubscription(
    resource: string,
    listener: EventListener,
    options?: RealtimeOptions
  ): Promise<void> {
    // 1. Get channel name from backend
    const res = await this.http.post<SubscribeResponse>(
      `/v1/realtime/${this.projectId}/subscribe`,
      {
        table_or_collection: resource,
        event_types: options?.eventTypes ?? ["INSERT", "UPDATE", "DELETE"],
      }
    );

    const { channel } = res.data;

    // 2. Track the subscription
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, {
        channel,
        resource,
        listeners: new Set(),
      });
    }
    this.subscriptions.get(channel)!.listeners.add(listener);

    // 3. Connect if not already connected
    await this._ensureConnected();

    // 4. Join the Socket.io room / channel
    this.socket!.emit("subscribe", { channel });

    // 5. Register the channel handler once (idempotent guard via Map)
    this._registerChannelHandler(channel);
  }

  private async _ensureConnected(): Promise<void> {
    if (this.socket?.connected) return;

    if (this.connecting) {
      // Wait for the pending connection
      await this._waitForConnection();
      return;
    }

    this.connecting = true;

    return new Promise((resolve, reject) => {
      this.socket = io(this.baseUrl, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        namespace: `/${this.projectId}`,
        auth: (cb) => {
          // Inject the API key as the connection credential
          cb({ apiKey: this._getApiKey() });
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.once("connect", () => {
        this.connecting = false;
        resolve();
      });

      this.socket.once("connect_error", (err) => {
        this.connecting = false;
        reject(new Error(`Realtime connection failed: ${err.message}`));
      });
    });
  }

  private _waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.connecting) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Register a socket event handler for a channel (only once per channel).
   * Uses the socket's own listener count to guard against duplicates.
   */
  private _registerChannelHandler(channel: string): void {
    if (!this.socket) return;

    // Avoid double-registering — socket.io counts listeners per event name
    if (this.socket.listeners(channel).length > 0) return;

    this.socket.on(channel, (raw: unknown) => {
      const sub = this.subscriptions.get(channel);
      if (!sub || sub.listeners.size === 0) return;

      const event = this._parseEvent(raw, sub.resource);
      if (!event) return;

      for (const listener of sub.listeners) {
        try {
          listener(event);
        } catch {
          // Never let a listener crash the realtime loop
        }
      }
    });
  }

  private _removeListener(resource: string, listener: EventListener): void {
    // Find the channel for this resource
    for (const [channel, sub] of this.subscriptions) {
      if (sub.resource === resource) {
        sub.listeners.delete(listener);

        // If no listeners remain, unsubscribe from the channel
        if (sub.listeners.size === 0) {
          this.subscriptions.delete(channel);
          this.socket?.emit("unsubscribe", { channel });
          this.socket?.off(channel);
        }
        return;
      }
    }
  }

  private _parseEvent(
    raw: unknown,
    resource: string
  ): RealtimeEvent | null {
    if (!raw || typeof raw !== "object") return null;

    const r = raw as Record<string, unknown>;
    const type = (r["type"] as string)?.toUpperCase() as RealtimeEventType;

    if (!["INSERT", "UPDATE", "DELETE"].includes(type)) return null;

    return {
      type,
      record: (r["new"] ?? r["record"]) as Record<string, unknown> | undefined,
      old: r["old"] as Record<string, unknown> | undefined,
      resource,
      projectId: this.projectId,
    };
  }

  /**
   * Extract the raw API key from the Authorization header injected by BaseFetch.
   * Used to authenticate the Socket.io connection.
   */
  private _getApiKey(): string {
    // BaseFetch stores the key internally; we reach it via a symbol trick.
    // In practice the BaasClient passes apiKey directly to RealtimeModule.
    return (this as unknown as { _apiKey?: string })._apiKey ?? "";
  }

  /**
   * Called by BaasClient to inject the API key for Socket.io auth.
   * @internal
   */
  _setApiKey(apiKey: string): void {
    (this as unknown as { _apiKey: string })._apiKey = apiKey;
  }
}