"use client";

import { useRouter } from "next/navigation";
import { logoutAuthUser } from "@/lib/auth-client";

type AdminLogoutButtonProps = {
  label: string;
  redirectHref: string;
};

export function AdminLogoutButton({ label, redirectHref }: AdminLogoutButtonProps) {
  const router = useRouter();

  const onLogout = async () => {
    await logoutAuthUser();
    router.replace(redirectHref);
  };

  return (
    <button
      type="button"
      onClick={() => void onLogout()}
      className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-rose-300 hover:text-rose-700"
    >
      {label}
    </button>
  );
}
