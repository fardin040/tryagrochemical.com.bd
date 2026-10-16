import { NextResponse } from "next/server";
import { createApplication } from "../../../lib/db";
export async function POST(request: Request) {
  const body = await request.json() as {jobId?:number; name?:string; email?:string; phone?:string; position?:string};
  if (!body.name || !body.email || !body.phone) return NextResponse.json({error:"Name, email and phone are required"}, {status:400});
  try { await createApplication({...body, name:body.name, email:body.email, phone:body.phone}); return NextResponse.json({ok:true}); }
  catch { return NextResponse.json({error:"Application storage is not configured"}, {status:503}); }
}
