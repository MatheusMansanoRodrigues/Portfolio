import { routePartykitRequest, Server } from "partyserver";
import type { Connection } from "partyserver";

/*
  Presence server (PartyServer / Cloudflare Durable Objects)
  ----------------------------------------------------------
  Retransmite a posição do cursor de cada visitante para todos os outros,
  ao vivo. Roda como Durable Object na sua conta Cloudflare.

  Mensagens:
    client → server:  { type: "cursor", x, y }
    server → client:
      { type: "hello",  id, name, color, country }   (só pra nova conexão)
      { type: "cursor", id, name, color, country, x, y }  (p/ todos exceto remetente)
      { type: "leave",  id }                         (p/ todos exceto quem saiu)
*/

type Env = { Main: DurableObjectNamespace<PresenceServer> };

interface ConnState {
  name: string;
  color: string;
  country: string | null;
}

const COLORS = [
  "#3b82f6", "#a855f7", "#22c55e", "#f59e0b",
  "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6",
];
const NAMES = [
  "Lince Brilhante",   "Macaco Dourado",    "Puma Veloz",
  "Lobo Prateado",     "Raposa Astuta",     "Jaguar Sombrio",
  "Falcão Certeiro",   "Coruja Sábia",      "Pantera Ágil",
  "Urso Majestoso",    "Lêmure Curioso",    "Golfinho Lúcido",
  "Tigre Ardente",     "Leão Audaz",        "Cobra Furtiva",
  "Águia Imponente",   "Capivara Serena",   "Onça Feroz",
  "Pinguim Elegante",  "Camaleão Vibrante",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export class PresenceServer extends Server<Env> {
  static options = { hibernate: true };

  // proteção leve contra flood de updates
  private readonly minIntervalMs = 30;
  private lastSeen = new Map<string, number>();

  onConnect(conn: Connection) {
    // country vem do header CF-IPCountry que o Worker recebe
    const country =
      (conn as unknown as { request?: Request }).request
        ? (new URL((conn as unknown as { request: Request }).request.url)
            .searchParams.get("country")) ?? null
        : null;

    const state: ConnState = {
      name: pick(NAMES),
      color: pick(COLORS),
      country,
    };
    conn.setState(state);

    conn.send(
      JSON.stringify({
        type: "hello",
        id: conn.id,
        name: state.name,
        color: state.color,
        country: state.country,
      })
    );
  }

  onMessage(sender: Connection, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    let data: { type: string; x?: number; y?: number };
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (
      data.type !== "cursor" ||
      typeof data.x !== "number" ||
      typeof data.y !== "number"
    ) {
      return;
    }

    // limites razoáveis — ignora valores absurdos
    if (data.x < -400 || data.y < -400 || data.x > 6000 || data.y > 6000)
      return;

    const state = sender.state as ConnState | undefined;
    if (!state) return;

    const now = Date.now();
    const last = this.lastSeen.get(sender.id) ?? 0;
    if (now - last < this.minIntervalMs) return;
    this.lastSeen.set(sender.id, now);

    this.broadcast(
      JSON.stringify({
        type: "cursor",
        id: sender.id,
        name: state.name,
        color: state.color,
        country: state.country,
        x: data.x,
        y: data.y,
      }),
      [sender.id]
    );
  }

  onClose(conn: Connection) {
    this.lastSeen.delete(conn.id);
    this.broadcast(JSON.stringify({ type: "leave", id: conn.id }));
  }

  onError(conn: Connection, _error: Error) {
    this.lastSeen.delete(conn.id);
    this.broadcast(JSON.stringify({ type: "leave", id: conn.id }));
  }
}

// Worker fetch handler — roteia /parties/main/:room para o Durable Object
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Injeta o país do visitante como query param antes de rotear
    const url = new URL(request.url);
    const country = (request as Request & { cf?: { country?: string } }).cf
      ?.country;
    if (country) url.searchParams.set("country", country);
    const enriched = new Request(url.toString(), request);

    return (
      (await routePartykitRequest(enriched, env)) ??
      new Response("Not Found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
