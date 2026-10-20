import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../lib/admin-auth";
import { getDb } from "../../../../lib/db";

const TABLES = {
  settings: ["setting_key", "setting_value"],
  pages: ["slug", "title", "content", "meta_description"],
  categories: ["name", "slug"],
  products: ["name", "description", "category", "image"],
  jobs: ["title", "location", "type", "description", "deadline"],
  certifications: ["title", "description", "icon"],
  dealers: ["name", "organization", "address", "district", "phone"],
  sales_officers: ["name", "designation", "area", "phone", "image"],
  messages: ["name", "phone", "message"],
  job_applications: ["job_id", "applicant_name", "email", "phone", "cover_letter", "resume", "status", "is_general"],
} as const;

type Table = keyof typeof TABLES;

function tableOf(request: Request): Table | null {
  const table = new URL(request.url).searchParams.get("table") as Table | null;
  return table && table in TABLES ? table : null;
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return unauthorized();
  const table = tableOf(request);
  const db = getDb();
  if (!table) return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  if (!db) return NextResponse.json({ error: "D1 binding is not configured" }, { status: 503 });
  const rows = (await db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 200`).all<Record<string, unknown>>()).results;
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return unauthorized();
  const table = tableOf(request);
  const db = getDb();
  if (!table) return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  if (!db) return NextResponse.json({ error: "D1 binding is not configured" }, { status: 503 });
  const body = await request.json() as Record<string, unknown>;
  const fields = TABLES[table].filter((field) => body[field] !== undefined);
  if (!fields.length) return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
  const values = fields.map((field) => body[field] === "" ? null : body[field]);
  const placeholders = fields.map(() => "?").join(",");
  await db.prepare(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${placeholders})`).bind(...values).run();
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!await isAdminRequest(request)) return unauthorized();
  const table = tableOf(request);
  const id = new URL(request.url).searchParams.get("id");
  const db = getDb();
  if (!table || !id || !/^\d+$/.test(id)) return NextResponse.json({ error: "Valid table and id are required" }, { status: 400 });
  if (!db) return NextResponse.json({ error: "D1 binding is not configured" }, { status: 503 });
  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(Number(id)).run();
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return unauthorized();
  const table = tableOf(request);
  const db = getDb();
  const body = await request.json() as Record<string, unknown> & { id?: number };
  if (!table || !body.id) return NextResponse.json({ error: "Valid table and id are required" }, { status: 400 });
  if (!db) return NextResponse.json({ error: "D1 binding is not configured" }, { status: 503 });
  const fields = TABLES[table].filter((field) => body[field] !== undefined);
  if (!fields.length) return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
  const values = fields.map((field) => body[field] === "" ? null : body[field]);
  await db.prepare(`UPDATE ${table} SET ${fields.map((field) => `${field} = ?`).join(",")} WHERE id = ?`).bind(...values, body.id).run();
  return NextResponse.json({ ok: true });
}
