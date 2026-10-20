const COOKIE_NAME = "try_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function text(value: string) {
  return new TextEncoder().encode(value);
}

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", text(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, text(value));
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createAdminSession() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured");
  const payload = `${Date.now() + SESSION_TTL_SECONDS * 1000}`;
  return `${payload}.${await signature(payload, secret)}`;
}

export async function isAdminRequest(request: Request) {
  const cookie = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  const token = request.headers.get("x-admin-token");
  const apiToken = process.env.ADMIN_API_TOKEN;
  if (apiToken && token === apiToken) return true;
  if (!cookie || !process.env.ADMIN_SESSION_SECRET) return false;
  const [expires, provided] = cookie.split(".");
  if (!expires || !provided || Number(expires) < Date.now()) return false;
  return provided === await signature(expires, process.env.ADMIN_SESSION_SECRET);
}

export function sessionCookie(value: string) {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`;
}

export function expiredSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function adminCredentialsConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET);
}
