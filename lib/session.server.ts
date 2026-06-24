import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE_NAME = "patishop_session";
const SESSION_TTL_DAYS = 30;

type SessionUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  return expiresAt;
}

function parseCookieHeader(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    const [key, ...rest] = part.split("=");
    if (key !== name) continue;
    return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function readSessionTokenFromCookieHeader(cookieHeader: string | null) {
  return parseCookieHeader(cookieHeader, SESSION_COOKIE_NAME);
}

export async function createSessionForUser(userId: number) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = getExpiryDate();

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function attachSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function deleteSessionFromRequest(request: Request) {
  const token = readSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) return;

  await prisma.session.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

export async function getSessionUserFromRequest(request: Request): Promise<SessionUser | null> {
  const token = readSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) return null;
  return getSessionUserFromToken(token);
}

export async function getSessionUserFromToken(token: string): Promise<SessionUser | null> {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const now = new Date();
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt <= now) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}
