import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { createDealerSession, dealerCookie, verifyPassword, clearDealerCookie } from "../../../../lib/dealer-auth";

export async function GET(request: Request) {
  const { getDealer } = await import("../../../../lib/dealer-auth");
  const dealer = await getDealer(request);
  return NextResponse.json({ authenticated: Boolean(dealer), dealer: dealer ? { id: dealer.id, business_name: dealer.business_name, contact_person: dealer.contact_person, email: dealer.email } : null });
}
export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string };
  const db = await getDb(); if (!db) return NextResponse.json({ error: "Dealer login unavailable." }, { status: 503 });
  const dealer = await db.prepare("SELECT * FROM dealer_accounts WHERE email=?").bind(body.email?.trim().toLowerCase() ?? "").first<Record<string, unknown>>();
  if (!dealer || dealer.status !== "active" || !(await verifyPassword(body.password ?? "", String(dealer.password_hash)))) return NextResponse.json({ error: "Invalid dealer credentials or inactive account." }, { status: 401 });
  const response = NextResponse.json({ authenticated: true });
  response.headers.append("Set-Cookie", dealerCookie(await createDealerSession(Number(dealer.id), db)));
  return response;
}
export async function DELETE() { const response = NextResponse.json({ authenticated: false }); response.headers.append("Set-Cookie", clearDealerCookie()); return response; }
