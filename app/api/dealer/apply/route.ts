import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/dealer-auth";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, string>;
  const required = ["businessName", "contactPerson", "email", "phone", "address", "district", "upazila", "license", "password"];
  if (required.some((key) => !body[key]?.trim()) || body.password.length < 8) return NextResponse.json({ error: "Complete all fields and use a password of at least 8 characters." }, { status: 400 });
  const db = await getDb(); if (!db) return NextResponse.json({ error: "Dealer applications are temporarily unavailable." }, { status: 503 });
  try {
    await db.prepare("INSERT INTO dealer_applications (business_name,contact_person,email,phone,address,district,upazila,license,password_hash) VALUES (?,?,?,?,?,?,?,?,?)")
      .bind(body.businessName.trim(), body.contactPerson.trim(), body.email.trim().toLowerCase(), body.phone.trim(), body.address.trim(), body.district.trim(), body.upazila.trim(), body.license.trim(), await hashPassword(body.password)).run();
    return NextResponse.json({ submitted: true }, { status: 201 });
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return NextResponse.json({ error: "An application for this email already exists." }, { status: 409 });
    return NextResponse.json({ error: "Unable to submit application." }, { status: 500 });
  }
}
