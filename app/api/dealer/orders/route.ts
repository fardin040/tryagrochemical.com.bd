import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { getDealer } from "../../../../lib/dealer-auth";

export async function GET(request: Request) {
  const dealer = await getDealer(request); if (!dealer) return NextResponse.json({ error: "Dealer login required." }, { status: 401 });
  const db = await getDb(); if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  const result = await db.prepare("SELECT id,items,subtotal,delivery_address,district,upazila,notes,payment_method,payment_status,status,created_at FROM dealer_orders WHERE dealer_id=? ORDER BY created_at DESC").bind(dealer.id).all();
  return NextResponse.json(result.results);
}
export async function POST(request: Request) {
  const dealer = await getDealer(request); if (!dealer) return NextResponse.json({ error: "Dealer login required." }, { status: 401 });
  const body = await request.json() as { items?: unknown[]; deliveryAddress?: string; district?: string; upazila?: string; notes?: string; paymentMethod?: string };
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50 || !body.deliveryAddress || !body.district || !body.upazila || !["cod", "sslcommerz"].includes(body.paymentMethod ?? "")) return NextResponse.json({ error: "Complete checkout details." }, { status: 400 });
  const db = await getDb(); if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  if (body.paymentMethod === "sslcommerz") return NextResponse.json({ error: "SSLCommerz online payment is not available yet. Please choose cash on delivery." }, { status: 503 });
  const requested = body.items.map((item) => {
    if (!item || typeof item !== "object") return null;
    const value = item as { id?: unknown; quantity?: unknown };
    const id = Number(value.id); const quantity = Number(value.quantity);
    return Number.isInteger(id) && id > 0 && Number.isInteger(quantity) && quantity > 0 && quantity <= 100 ? { id, quantity } : null;
  });
  if (requested.some((item) => !item) || new Set(requested.map((item) => item?.id)).size !== requested.length) return NextResponse.json({ error: "Invalid cart items or quantities." }, { status: 400 });
  const ids = requested.map((item) => item!.id);
  const products = (await db.prepare(`SELECT id,name FROM products WHERE id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all<{ id: number; name: string }>()).results;
  if (products.length !== ids.length) return NextResponse.json({ error: "One or more products are no longer available." }, { status: 400 });
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const items = requested.map((item) => ({ id: item!.id, name: productNames.get(item!.id), quantity: item!.quantity }));
  const result = await db.prepare("INSERT INTO dealer_orders (dealer_id,items,subtotal,delivery_address,district,upazila,notes,payment_method) VALUES (?,?,?,?,?,?,?,?)")
    .bind(dealer.id, JSON.stringify(items), 0, body.deliveryAddress.trim(), body.district.trim(), body.upazila.trim(), (body.notes ?? "").trim(), body.paymentMethod).run();
  return NextResponse.json({ orderId: (result as { meta?: { last_row_id?: number } }).meta?.last_row_id, payment: body.paymentMethod === "sslcommerz" ? "pending-configuration" : "cash-on-delivery" }, { status: 201 });
}
