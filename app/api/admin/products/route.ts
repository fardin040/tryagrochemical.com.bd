import { NextResponse } from "next/server";
import { getDb, listProducts } from "../../../../lib/db";
import { isAdminRequest } from "../../../../lib/admin-auth";
export async function GET(){ return NextResponse.json(await listProducts()); }
async function authorize(request: Request) {
  if (await isAdminRequest(request)) return null;
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) return NextResponse.json({ error: "Admin API token is not configured" }, { status: 503 });
  if (request.headers.get("x-admin-token") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
export async function POST(request:Request){const unauthorized=await authorize(request);if(unauthorized)return unauthorized;const db=getDb(); if(!db)return NextResponse.json({error:"D1 binding DB is not configured"},{status:503}); const b=await request.json() as {name?:string;category?:string;description?:string;image?:string}; if(!b.name)return NextResponse.json({error:"name is required"},{status:400}); await db.prepare("INSERT INTO products (name,category,description,image) VALUES (?,?,?,?)").bind(b.name,b.category??"",b.description??"",b.image??null).run(); return NextResponse.json({ok:true},{status:201});}
export async function DELETE(request:Request){const unauthorized=await authorize(request);if(unauthorized)return unauthorized;const db=getDb(); if(!db)return NextResponse.json({error:"D1 binding DB is not configured"},{status:503}); const id=new URL(request.url).searchParams.get("id"); if(!id)return NextResponse.json({error:"id is required"},{status:400}); await db.prepare("DELETE FROM products WHERE id = ?").bind(Number(id)).run(); return NextResponse.json({ok:true});}
