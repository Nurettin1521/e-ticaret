import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileClient } from "@/app/profile/profile-client";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7faf8]" />}>
      <ProfileClient />
    </Suspense>
  );
}
