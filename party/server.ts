import { routePartykitRequest, Server } from "partyserver";
import type { Connection } from "partyserver";

/*
  Presence server — cursores ao vivo, chat, explosões, escudo e placar.

  client → server:
    { type: "cursor",  x, y }
    { type: "chat",    text }
    { type: "explode", targetId }
    { type: "shield" }              — ativa escudo (botão direito)

  server → client:
    { type: "hello",   id, name, color, country }
    { type: "cursor",  id, name, color, country, x, y }
    { type: "chat",    id, name, color, text }
    { type: "explode", id, killerId, killerName }   — id = vítima
    { type: "shield",  id, until }                  — until = timestamp ms
    { type: "score",   scores[] }
    { type: "leave",   id }
*/

type Env = { Main: DurableObjectNamespace<PresenceServer> };

interface ConnState {
  name:        string;
  color:       string;
  country:     string | null;
  score:       number;
  shieldUntil: number;   // timestamp ms, 0 = sem escudo
  shieldCooldownUntil: number;
}

const SHIELD_DURATION_MS  = 3000;
const SHIELD_COOLDOWN_MS  = 8000;

const COLORS = [
  "#3b82f6", "#a855f7", "#22c55e", "#f59e0b",
  "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6",
];

const NAMES = [
  "Lince Brilhante",  "Macaco Dourado",   "Puma Veloz",
  "Lobo Prateado",    "Raposa Astuta",    "Jaguar Sombrio",
  "Falcão Certeiro",  "Coruja Sábia",     "Pantera Ágil",
  "Urso Majestoso",   "Lêmure Curioso",   "Golfinho Lúcido",
  "Tigre Ardente",    "Leão Audaz",       "Cobra Furtiva",
  "Águia Imponente",  "Capivara Serena",  "Onça Feroz",
  "Pinguim Elegante", "Camaleão Vibrante",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class PresenceServer extends Server<Env> {
  static options = { hibernate: true };

  private readonly minCursorMs = 30;
  private lastCursor = new Map<string, number>();

  onConnect(conn: Connection) {
    const country =
      (conn as unknown as { request?: Request }).request
        ? (new URL((conn as unknown as { request: Request }).request.url)
            .searchParams.get("country")) ?? null
        : null;

    const state: ConnState = {
      name:               pick(NAMES),
      color:              pick(COLORS),
      country,
      score:              0,
      shieldUntil:        0,
      shieldCooldownUntil: 0,
    };
    conn.setState(state);

    conn.send(JSON.stringify({
      type: "hello", id: conn.id,
      name: state.name, color: state.color, country: state.country,
    }));
    conn.send(JSON.stringify({ type: "score", scores: this._buildScores() }));
  }

  onMessage(sender: Connection, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    let data: Record<string, unknown>;
    try { data = JSON.parse(message); } catch { return; }

    const state = sender.state as ConnState | undefined;
    if (!state) return;

    switch (data.type) {

      case "cursor": {
        const x = data.x as number, y = data.y as number;
        if (typeof x !== "number" || typeof y !== "number") return;
        if (x < -400 || y < -400 || x > 6000 || y > 6000) return;

        const now = Date.now();
        if (now - (this.lastCursor.get(sender.id) ?? 0) < this.minCursorMs) return;
        this.lastCursor.set(sender.id, now);

        this.broadcast(JSON.stringify({
          type: "cursor", id: sender.id,
          name: state.name, color: state.color, country: state.country,
          x, y,
        }), [sender.id]);
        break;
      }

      case "chat": {
        const raw = String(data.text ?? "").trim().slice(0, 120);
        if (!raw) return;
        this.broadcast(JSON.stringify({
          type: "chat", id: sender.id,
          name: state.name, color: state.color, text: raw,
        }));
        break;
      }

      case "shield": {
        const now = Date.now();
        // respeita cooldown
        if (now < state.shieldCooldownUntil) return;

        state.shieldUntil        = now + SHIELD_DURATION_MS;
        state.shieldCooldownUntil = now + SHIELD_COOLDOWN_MS;
        sender.setState(state);

        // broadcast para todos verem o escudo
        this.broadcast(JSON.stringify({
          type: "shield", id: sender.id, until: state.shieldUntil,
        }));
        break;
      }

      case "explode": {
        const targetId = String(data.targetId ?? "");
        const target   = this.getConnection(targetId);
        if (!target) return;

        const targetState = target.state as ConnState | undefined;
        if (!targetState) return;

        // escudo ativo? bloqueia e avisa o atacante
        if (Date.now() < targetState.shieldUntil) {
          sender.send(JSON.stringify({
            type: "chat", id: targetId,
            name: targetState.name, color: targetState.color,
            text: "🛡️ escudo bloqueou!",
          }));
          return;
        }

        state.score += 1;
        sender.setState(state);

        this.broadcast(JSON.stringify({
          type: "explode", id: targetId,
          killerId: sender.id, killerName: state.name,
        }));
        this.broadcast(JSON.stringify({ type: "score", scores: this._buildScores() }));
        break;
      }
    }
  }

  onClose(conn: Connection) {
    this.lastCursor.delete(conn.id);
    this.broadcast(JSON.stringify({ type: "leave",  id: conn.id }));
    this.broadcast(JSON.stringify({ type: "score",  scores: this._buildScores() }));
  }

  onError(conn: Connection, _error: Error) {
    this.lastCursor.delete(conn.id);
    this.broadcast(JSON.stringify({ type: "leave", id: conn.id }));
  }

  private _buildScores() {
    return [...this.getConnections()]
      .map(c => {
        const s = c.state as ConnState | undefined;
        return s ? { id: c.id, name: s.name, color: s.color, score: s.score } : null;
      })
      .filter(Boolean) as { id: string; name: string; color: string; score: number }[];
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url     = new URL(request.url);
    const country = (request as Request & { cf?: { country?: string } }).cf?.country;
    if (country) url.searchParams.set("country", country);
    const enriched = new Request(url.toString(), request);
    return (await routePartykitRequest(enriched, env)) ?? new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
