import { NextResponse } from "next/server";
import { createMessage } from "../../../lib/db";
export async function POST(request: Request) {
  const body = await request.json() as {name?:string; phone?:string; message?:string};
  if (!body.name || !body.phone || !body.message) return NextResponse.json({error:"Name, phone and message are required"}, {status:400});
  try { await createMessage({name:body.name, phone:body.phone, message:body.message}); return NextResponse.json({ok:true}); }
  catch { return NextResponse.json({error:"Message storage is not configured"}, {status:503}); }
}
