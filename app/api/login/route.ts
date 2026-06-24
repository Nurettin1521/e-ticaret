import { NextResponse } from "next/server";
import { findUserByCredentials } from "@/lib/users.server";
import { attachSessionCookie, createSessionForUser } from "@/lib/session.server";

type LoginPayload = {
  email?: string;
  password?: string;
  loginType?: "customer" | "admin";
};

export async function POST(request: Request) {
  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const email = payload.email?.trim() ?? "";
  const password = payload.password ?? "";
  const loginType = payload.loginType === "admin" ? "admin" : "customer";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const user = await findUserByCredentials(email, password);
  if (!user) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }
  if (loginType === "admin" && !user.isAdmin) {
    return NextResponse.json({ ok: false, error: "ADMIN_REQUIRED" }, { status: 403 });
  }

  const { token, expiresAt } = await createSessionForUser(user.id);
  const response = NextResponse.json({
    ok: true,
    user: {
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });
  attachSessionCookie(response, token, expiresAt);
  return response;
}
