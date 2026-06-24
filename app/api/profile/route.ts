import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserFromRequest } from "@/lib/session.server";

type ProfilePayload = {
  address?: string;
  phone?: string;
};

function normalizeProfile(profile: { address: string; phone: string }) {
  return {
    address: profile.address ?? "",
    phone: profile.phone ?? "",
  };
}

export async function GET(request: Request) {
  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      address: true,
      phone: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    profile: normalizeProfile(user),
  });
}

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUserFromRequest(request);
  if (!sessionUser) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  let payload: ProfilePayload;

  try {
    payload = (await request.json()) as ProfilePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const address = payload.address?.trim() ?? "";
  const phone = payload.phone?.trim() ?? "";

  const updated = await prisma.user.update({
    where: { id: sessionUser.id },
    data: {
      address,
      phone,
    },
    select: {
      address: true,
      phone: true,
    },
  });

  return NextResponse.json({
    ok: true,
    profile: normalizeProfile(updated),
  });
}
