// Optional automated WhatsApp sending via whatsapp-web.js.
// Lazily required so the app boots even if the dependency isn't installed.
// The renderer also supports zero-setup wa.me deep links (see preload/quickSend).
import { app } from "electron";
import path from "path";
import QRCode from "qrcode";

let client = null;
let status = "disconnected"; // disconnected | qr | authenticating | ready
let lastQrDataUrl = null;

function normalize(number) {
  let n = String(number || "").replace(/\D/g, "");
  if (n.length === 10) n = "91" + n; // default India
  return n + "@c.us";
}

export function getStatus() {
  return { status, qr: lastQrDataUrl };
}

export async function connect(onEvent) {
  if (client) return getStatus();
  let WA;
  try {
    WA = await import("whatsapp-web.js");
  } catch (e) {
    status = "error";
    return { status, error: "whatsapp-web.js not installed. Run npm install, or use quick-send (wa.me) instead." };
  }
  const { Client, LocalAuth } = WA.default || WA;
  status = "authenticating";
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: path.join(app.getPath("userData"), "wa-session") }),
    puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] }
  });

  client.on("qr", async (qr) => {
    status = "qr";
    lastQrDataUrl = await QRCode.toDataURL(qr);
    onEvent && onEvent(getStatus());
  });
  client.on("authenticated", () => { status = "authenticating"; onEvent && onEvent(getStatus()); });
  client.on("ready", () => { status = "ready"; lastQrDataUrl = null; onEvent && onEvent(getStatus()); });
  client.on("disconnected", () => { status = "disconnected"; client = null; onEvent && onEvent(getStatus()); });

  client.initialize().catch(() => { status = "error"; onEvent && onEvent(getStatus()); });
  return getStatus();
}

export async function sendMessage(number, text) {
  if (!client || status !== "ready") return { ok: false, error: "WhatsApp not connected. Connect first or use quick-send." };
  try {
    await client.sendMessage(normalize(number), text);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

export async function disconnect() {
  if (client) { try { await client.destroy(); } catch {} client = null; }
  status = "disconnected"; lastQrDataUrl = null;
  return getStatus();
}
