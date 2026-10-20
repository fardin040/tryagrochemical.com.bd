import { getDb, type D1Database } from "./db";

const COOKIE = "try_dealer_session";
const TTL = 60 * 60 * 24 * 7;

function bytes(value: string) { return new TextEncoder().encode(value); }
async function digest(value: string) {
  const result = await crypto.subtle.digest("SHA-256", bytes(value));
  return Array.from(new Uint8Array(result)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export async function hashPassword(password: string) {
  const salt = crypto.randomUUID();
  const key = await crypto.subtle.importKey("raw", bytes(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: bytes(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
  return `${salt}:${btoa(String.fromCharCode(...new Uint8Array(bits)))}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const key = await crypto.subtle.importKey("raw", bytes(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: bytes(salt), iterations: 120000, hash: "SHA-256" }, key, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits))) === expected;
}
export async function createDealerSession(dealerId: number, db?: D1Database) {
  const database = db ?? await getDb(); if (!database) throw new Error("Database unavailable");
  const id = `${crypto.randomUUID()}-${await digest(crypto.randomUUID())}`;
  await database.prepare("INSERT INTO dealer_sessions (id,dealer_id,expires_at) VALUES (?,?,?)").bind(id, dealerId, Date.now() + TTL * 1000).run();
  return id;
}
export async function getDealer(request: Request, db?: D1Database) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE}=([^;]+)`))?.[1];
  if (!token) return null;
  const database = db ?? await getDb(); if (!database) return null;
  return database.prepare("SELECT d.* FROM dealer_sessions s JOIN dealer_accounts d ON d.id=s.dealer_id WHERE s.id=? AND s.expires_at>? AND d.status='active'").bind(token, Date.now()).first<Record<string, unknown>>();
}
export function dealerCookie(token: string) { return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${TTL}`; }
export function clearDealerCookie() { return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
