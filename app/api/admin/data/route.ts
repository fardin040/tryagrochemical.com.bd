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
  dealer_applications: ["business_name", "contact_person", "email", "phone", "address", "district", "upazila", "license", "status", "reviewed_at", "reviewed_by"],
  dealer_orders: ["status", "payment_status"],
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
  const db = await getDb();
  if (!table) return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  if (!db) return NextResponse.json({ error: "D1 binding is not configured" }, { status: 503 });
  const rows = (await db.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 200`).all<Record<string, unknown>>()).results;
  if (table === "dealer_applications") rows.forEach((row) => delete row.password_hash);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return unauthorized();
  const table = tableOf(request);
  const db = await getDb();
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
  const db = await getDb();
  if (!table || !id || !/^\d+$/.test(id)) return NextResponse.json({ error: "Valid table and id are required" }, { status: 400 });
  if (!db) return NextResponse.json({ error: "D1 binding is not configured" }, { status: 503 });
  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(Number(id)).run();
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!await isAdminRequest(request)) return unauthorized();
  const table = tableOf(request);
  const db = await getDb();
  const body = await request.json() as Record<string, unknown> & { id?: number };
  if (!table || !body.id) return NextResponse.json({ error: "Valid table and id are required" }, { status: 400 });
  if (!db) return NextResponse.json({ error: "D1 binding is not configured" }, { status: 503 });
  const fields = TABLES[table].filter((field) => body[field] !== undefined);
  if (!fields.length) return NextResponse.json({ error: "No editable fields supplied" }, { status: 400 });
  const values = fields.map((field) => body[field] === "" ? null : body[field]);
  await db.prepare(`UPDATE ${table} SET ${fields.map((field) => `${field} = ?`).join(",")} WHERE id = ?`).bind(...values, body.id).run();
  if (table === "dealer_applications" && body.status !== undefined) {
    await db.prepare("UPDATE dealer_applications SET reviewed_at=CURRENT_TIMESTAMP, reviewed_by=? WHERE id=?")
      .bind(process.env.ADMIN_USERNAME ?? "admin", body.id).run();
    const application = await db.prepare("SELECT * FROM dealer_applications WHERE id=?").bind(body.id).first<Record<string, unknown>>();
    if (!application) return NextResponse.json({ error: "Dealer application not found" }, { status: 404 });
    if (application.status === "approved") {
      await db.prepare(`INSERT INTO dealer_accounts
        (application_id,business_name,contact_person,email,phone,address,district,upazila,license,password_hash,status)
        VALUES (?,?,?,?,?,?,?,?,?,?, 'active')
        ON CONFLICT(application_id) DO UPDATE SET business_name=excluded.business_name,
        contact_person=excluded.contact_person,email=excluded.email,phone=excluded.phone,address=excluded.address,
        district=excluded.district,upazila=excluded.upazila,license=excluded.license,password_hash=excluded.password_hash,
        status='active',updated_at=CURRENT_TIMESTAMP`)
        .bind(application.id, application.business_name, application.contact_person, application.email, application.phone,
          application.address, application.district, application.upazila, application.license, application.password_hash).run();
    } else {
      await db.prepare("UPDATE dealer_accounts SET status='disabled',updated_at=CURRENT_TIMESTAMP WHERE application_id=?")
        .bind(application.id).run();
    }
  }
  return NextResponse.json({ ok: true });
}
