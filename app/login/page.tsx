import { Suspense } from "react";
import { LoginClient } from "@/app/login/login-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7faf8]" />}>
      <LoginClient />
    </Suspense>
  );
}
