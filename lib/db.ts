import { certifications as fallbackCertifications, products as fallbackProducts, pages as fallbackPages, settings as fallbackSettings, jobs as fallbackJobs } from "./data";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface D1Database {
  prepare(query: string): { all<T>(): Promise<{ results: T[] }>; first<T>(): Promise<T | null>; run(): Promise<unknown>; bind(...values: unknown[]): { all<T>(): Promise<{ results: T[] }>; first<T>(): Promise<T | null>; run(): Promise<unknown> } };
}
export type DbProduct = { id: number; name: string; category: string | null; image: string | null; description: string | null };
export type DbPage = { id: number; slug: string; title: string; content: string; meta_description: string | null };
export type DbJob = { id: number; title: string; location: string; type: string; description: string; deadline: string };
export type DbCertification = { id: number; title: string; description: string | null; icon: string | null };

export async function getDb(): Promise<D1Database | undefined> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as { DB?: D1Database }).DB;
}
export async function listProducts(db?: D1Database): Promise<DbProduct[]> {
  const database = db ?? await getDb();
  if (!database) return fallbackProducts.map(p => ({ id: p.id, name: p.name, category: p.category, image: p.image ?? null, description: p.description ?? null }));
  const results = (await database.prepare("SELECT id,name,category,image,description FROM products ORDER BY created_at DESC").all<DbProduct>()).results;
  return results.length > 0 ? results : fallbackProducts.map(p => ({ id: p.id, name: p.name, category: p.category, image: p.image ?? null, description: p.description ?? null }));
}
export async function getPage(slug: string, db?: D1Database): Promise<DbPage | undefined> {
  const database = db ?? await getDb();
  if (!database) { const p = fallbackPages[slug]; return p ? { id: 0, slug, title: p.title, content: p.content, meta_description: p.metaDescription } : undefined; }
  return (await database.prepare("SELECT id,slug,title,content,meta_description FROM pages WHERE slug = ?").bind(slug).first<DbPage>()) ?? undefined;
}
export async function getSettings(db?: D1Database) {
  const database = db ?? await getDb();
  if (!database) return fallbackSettings;
  const rows = (await database.prepare("SELECT setting_key,setting_value FROM settings").all<{ setting_key: string; setting_value: string | null }>()).results;
  return rows.reduce<Record<string, string>>((result, row) => {
    result[row.setting_key] = row.setting_value ?? "";
    return result;
  }, {});
}
export async function listCertifications(db?: D1Database): Promise<DbCertification[]> {
  const database = db ?? await getDb();
  if (!database) return fallbackCertifications.map((item, id) => ({ id, title: item.title, description: item.description, icon: item.icon }));
  return (await database.prepare("SELECT id,title,description,icon FROM certifications ORDER BY id").all<DbCertification>()).results;
}
export async function listJobs(db?: D1Database): Promise<DbJob[]> {
  const database = db ?? await getDb();
  if (!database) return fallbackJobs;
  try {
    return (await database.prepare("SELECT id,title,location,type,description,deadline FROM jobs WHERE deadline IS NULL OR deadline >= date('now') ORDER BY created_at DESC").all<DbJob>()).results;
  } catch (error) {
    if (error instanceof Error && error.message.includes("no such table: jobs")) return fallbackJobs;
    throw error;
  }
}
export async function listDealers(db?: D1Database) {
  const database = db ?? await getDb();
  if (!database) return [];
  try {
    return (await database.prepare("SELECT * FROM dealers ORDER BY district,name").all()).results;
  } catch (error) {
    if (error instanceof Error && error.message.includes("no such table: dealers")) return [];
    throw error;
  }
}
export async function listSalesOfficers(db?: D1Database) {
  const database = db ?? await getDb();
  if (!database) return [];
  try {
    return (await database.prepare("SELECT * FROM sales_officers ORDER BY name").all()).results;
  } catch (error) {
    if (error instanceof Error && error.message.includes("no such table: sales_officers")) return [];
    throw error;
  }
}
export async function createMessage(input: {name:string; phone:string; message:string}, db?: D1Database) {
  const database = db ?? await getDb();
  if (!database) throw new Error("D1 binding DB is not configured");
  return database.prepare("INSERT INTO messages (name,phone,message) VALUES (?,?,?)").bind(input.name, input.phone, input.message).run();
}
export async function createApplication(input: {jobId?: number; name:string; email:string; phone:string; position?:string; resume?:string}, db?: D1Database) {
  const database = db ?? await getDb();
  if (!database) throw new Error("D1 binding DB is not configured");
  return database.prepare("INSERT INTO job_applications (job_id,applicant_name,email,phone,cover_letter,resume,is_general) VALUES (?,?,?,?,?,?,?)")
    .bind(input.jobId ?? null, input.name, input.email, input.phone, input.position ?? "", input.resume ?? "submitted-online", input.jobId ? 0 : 1).run();
}
