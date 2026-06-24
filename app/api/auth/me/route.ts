import { NextResponse } from "next/server";
import { getSessionUserFromRequest } from "@/lib/session.server";

export async function GET(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });
}
