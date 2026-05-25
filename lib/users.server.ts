import "server-only";

import { prisma } from "@/lib/db";

export type AuthenticatedUser = {
  name: string;
  email: string;
};

export async function findUserByCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) return null;
  if (user.passwordHash !== password) return null;

  return {
    name: user.name,
    email: user.email,
  } satisfies AuthenticatedUser;
}
