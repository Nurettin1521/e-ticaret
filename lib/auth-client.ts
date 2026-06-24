"use client";

export type AuthUser = {
  name: string;
  email: string;
  isAdmin?: boolean;
};

export const AUTH_USER_STORAGE_KEY = "patishop_auth_user";
export const AUTH_CHANGE_EVENT = "patishop-auth-change";

let lastAuthRaw: string | null | undefined;
let lastAuthParsed: AuthUser | null = null;

function parseAuthUser(raw: string | null): AuthUser | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.name || !parsed?.email) return null;

    return {
      name: parsed.name,
      email: parsed.email,
      isAdmin: Boolean(parsed.isAdmin),
    };
  } catch {
    return null;
  }
}

export function getAuthUserSnapshot(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (raw === lastAuthRaw) {
    return lastAuthParsed;
  }

  lastAuthRaw = raw;
  lastAuthParsed = parseAuthUser(raw);
  return lastAuthParsed;
}

export function getServerAuthUserSnapshot() {
  return null;
}

export function subscribeAuthUser(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener(AUTH_CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(AUTH_CHANGE_EVENT, listener);
  };
}

export function setAuthUser(user: AuthUser) {
  if (typeof window === "undefined") return;

  const name = user.name.trim();
  const email = user.email.trim().toLowerCase();
  if (!name || !email) return;

  window.localStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify({ name, email, isAdmin: Boolean(user.isAdmin) }),
  );
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearAuthUser() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export async function hydrateAuthUserFromSession() {
  if (typeof window === "undefined") return;

  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (!response.ok) {
      clearAuthUser();
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; user?: { name?: string; email?: string; isAdmin?: boolean } }
      | null;

    if (!payload?.ok || !payload.user?.name || !payload.user?.email) {
      clearAuthUser();
      return;
    }

    setAuthUser({
      name: payload.user.name,
      email: payload.user.email,
      isAdmin: Boolean(payload.user.isAdmin),
    });
  } catch {
    // no-op
  }
}

export async function logoutAuthUser() {
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/logout", {
      method: "POST",
    });
  } catch {
    // no-op
  } finally {
    clearAuthUser();
  }
}
