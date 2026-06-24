import "server-only";

import { prisma } from "@/lib/db";

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

export async function findUserByCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) return null;
  if (user.passwordHash !== password) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  } satisfies AuthenticatedUser;
}
