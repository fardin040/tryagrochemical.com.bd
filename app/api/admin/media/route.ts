import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isAdminRequest } from "../../../../lib/admin-auth";

type MediaBucket = { put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown> };

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as { MEDIA?: MediaBucket }).MEDIA;
  if (!bucket) return NextResponse.json({ error: "R2 MEDIA binding is not configured" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "A file is required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024 || !file.type.startsWith("image/")) return NextResponse.json({ error: "Only images up to 5 MB are allowed" }, { status: 400 });
  const key = `media/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return NextResponse.json({ key, url: `/api/media/${encodeURIComponent(key)}` }, { status: 201 });
}
