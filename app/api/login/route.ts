import { NextResponse } from "next/server";
import { findUserByCredentials } from "@/lib/users.server";

type LoginPayload = {
  email?: string;
  password?: string;
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

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
  }

  const user = await findUserByCredentials(email, password);
  if (!user) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, user });
}
