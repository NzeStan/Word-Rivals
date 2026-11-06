import { freshAccessToken, refreshAccessToken } from '@/api/http';
import { WS_BASE } from '@/config/app';

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

type Handlers = {
  onMessage: (message: any) => void;
  onStatus?: (status: SocketStatus) => void;
  /** The server closed for good: not allowed to see this, or rate limited past recovery. */
  onFatal?: (code: number) => void;
  /** Called on every successful connection, including reconnects. */
  onOpen?: (isReconnect: boolean) => void;
};

const PING_MS = 25000;
const MAX_BACKOFF_MS = 15000;

/** A WebSocket that reconnects with backoff and always uses a fresh access token. */
export class GameSocket {
  private ws: WebSocket | null = null;
  private stopped = false;
  private attempts = 0;
  private opened = false;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private ping: ReturnType<typeof setInterval> | null = null;

  constructor(
    private path: string,
    private handlers: Handlers,
  ) {}

  start() {
    this.stopped = false;
    void this.connect();
  }

  stop() {
    this.stopped = true;
    this.clearTimers();
    this.ws?.close(1000);
    this.ws = null;
    this.handlers.onStatus?.('closed');
  }

  /** Reconnect now, e.g. when the app returns to the foreground. */
  nudge() {
    if (this.stopped) return;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ action: 'ping' });
      return;
    }
    this.clearTimers();
    this.attempts = 0;
    void this.connect();
  }

  send(message: object): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(message));
    return true;
  }

  private clearTimers() {
    if (this.retry) clearTimeout(this.retry);
    if (this.ping) clearInterval(this.ping);
    this.retry = null;
    this.ping = null;
  }

  private async connect() {
    this.handlers.onStatus?.(this.opened ? 'reconnecting' : 'connecting');
    let token: string | null = null;
    try {
      token = await freshAccessToken();
    } catch {
      // Offline. The retry below covers it.
    }
    if (this.stopped) return;
    if (!token) {
      this.scheduleRetry();
      return;
    }

    const previous = this.ws;
    if (previous) {
      previous.onclose = null;
      previous.close();
    }
    const ws = new WebSocket(`${WS_BASE}/${this.path}`, ['access_token', token]);
    this.ws = ws;

    ws.onopen = () => {
      const isReconnect = this.opened;
      this.opened = true;
      this.attempts = 0;
      this.handlers.onStatus?.('open');
      this.handlers.onOpen?.(isReconnect);
      if (this.ping) clearInterval(this.ping);
      this.ping = setInterval(() => this.send({ action: 'ping' }), PING_MS);
    };
    ws.onmessage = (e) => {
      try {
        this.handlers.onMessage(JSON.parse(e.data as string));
      } catch {
        // Ignore a malformed frame; resync covers anything missed.
      }
    };
    ws.onclose = (e) => {
      if (this.ping) clearInterval(this.ping);
      this.ping = null;
      if (this.stopped) return;
      if (e.code === 4404 || e.code === 4403) {
        this.handlers.onStatus?.('closed');
        this.handlers.onFatal?.(e.code);
        return;
      }
      if (e.code === 4401) {
        void refreshAccessToken()
          .catch(() => null)
          .finally(() => this.scheduleRetry());
        return;
      }
      this.scheduleRetry();
    };
  }

  private scheduleRetry() {
    if (this.stopped) return;
    this.handlers.onStatus?.('reconnecting');
    const base = Math.min(1000 * 2 ** this.attempts, MAX_BACKOFF_MS);
    this.attempts += 1;
    this.retry = setTimeout(() => void this.connect(), base * (0.7 + Math.random() * 0.6));
  }
}
