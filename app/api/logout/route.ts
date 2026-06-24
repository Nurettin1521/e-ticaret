import { NextResponse } from "next/server";
import { clearSessionCookie, deleteSessionFromRequest } from "@/lib/session.server";

export async function POST(request: Request) {
  await deleteSessionFromRequest(request);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
