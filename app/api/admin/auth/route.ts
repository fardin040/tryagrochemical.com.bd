import { NextResponse } from "next/server";
import { adminCredentialsConfigured, createAdminSession, expiredSessionCookie, isAdminRequest, sessionCookie } from "../../../../lib/admin-auth";

export async function GET(request: Request) {
  return NextResponse.json({ authenticated: await isAdminRequest(request) });
}

export async function POST(request: Request) {
  if (!adminCredentialsConfigured()) {
    return NextResponse.json({ error: "Admin credentials are not configured" }, { status: 503 });
  }
  const body = await request.json() as { username?: string; password?: string };
  if ((body.username ?? (body as { email?: string }).email) !== process.env.ADMIN_USERNAME || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  response.headers.append("Set-Cookie", sessionCookie(await createAdminSession()));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.headers.append("Set-Cookie", expiredSessionCookie());
  return response;
}
