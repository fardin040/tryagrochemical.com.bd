import { products as fallbackProducts, pages as fallbackPages, jobs as fallbackJobs } from "./data";

export interface D1Database {
  prepare(query: string): { all<T>(): Promise<{ results: T[] }>; first<T>(): Promise<T | null>; run(): Promise<unknown>; bind(...values: unknown[]): { all<T>(): Promise<{ results: T[] }>; first<T>(): Promise<T | null>; run(): Promise<unknown> } };
}
export type DbProduct = { id: number; name: string; category: string | null; image: string | null; description: string | null };
export type DbPage = { id: number; slug: string; title: string; content: string; meta_description: string | null };
export type DbJob = { id: number; title: string; location: string; type: string; description: string; deadline: string };

export function getDb(): D1Database | undefined {
  return (globalThis as typeof globalThis & { DB?: D1Database }).DB;
}
export async function listProducts(db = getDb()): Promise<DbProduct[]> {
  if (!db) return fallbackProducts.map(p => ({ id: p.id, name: p.name, category: p.category, image: p.image ?? null, description: p.description ?? null }));
  return (await db.prepare("SELECT id,name,category,image,description FROM products ORDER BY created_at DESC").all<DbProduct>()).results;
}
export async function getPage(slug: string, db = getDb()): Promise<DbPage | undefined> {
  if (!db) { const p = fallbackPages[slug]; return p ? { id: 0, slug, title: p.title, content: p.content, meta_description: p.metaDescription } : undefined; }
  return (await db.prepare("SELECT id,slug,title,content,meta_description FROM pages WHERE slug = ?").bind(slug).first<DbPage>()) ?? undefined;
}
export async function listJobs(db = getDb()): Promise<DbJob[]> {
  if (!db) return fallbackJobs;
  return (await db.prepare("SELECT id,title,location,type,description,deadline FROM jobs WHERE deadline IS NULL OR deadline >= date('now') ORDER BY created_at DESC").all<DbJob>()).results;
}
export async function listDealers(db = getDb()) { return db ? (await db.prepare("SELECT * FROM dealers ORDER BY district,name").all()).results : []; }
export async function listSalesOfficers(db = getDb()) { return db ? (await db.prepare("SELECT * FROM sales_officers ORDER BY name").all()).results : []; }
export async function createMessage(input: {name:string; phone:string; message:string}, db = getDb()) {
  if (!db) throw new Error("D1 binding DB is not configured");
  return db.prepare("INSERT INTO messages (name,phone,message) VALUES (?,?,?)").bind(input.name, input.phone, input.message).run();
}
export async function createApplication(input: {jobId?: number; name:string; email:string; phone:string; position?:string; resume?:string}, db = getDb()) {
  if (!db) throw new Error("D1 binding DB is not configured");
  return db.prepare("INSERT INTO job_applications (job_id,applicant_name,email,phone,cover_letter,resume,is_general) VALUES (?,?,?,?,?,?,?)")
    .bind(input.jobId ?? null, input.name, input.email, input.phone, input.position ?? "", input.resume ?? "submitted-online", input.jobId ? 0 : 1).run();
}
