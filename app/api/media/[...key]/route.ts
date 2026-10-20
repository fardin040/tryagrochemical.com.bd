import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type MediaBucket = { get(key: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null> };

export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as { MEDIA?: MediaBucket }).MEDIA;
  if (!bucket) return NextResponse.json({ error: "Media storage is not configured" }, { status: 503 });
  const object = await bucket.get((await params).key.join("/"));
  if (!object) return new NextResponse(null, { status: 404 });
  return new NextResponse(object.body, { headers: { "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream", "Cache-Control": "public, max-age=31536000, immutable" } });
}
