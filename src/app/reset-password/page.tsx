import { Suspense } from "react";
import ResetPasswordClient from "@/app/reset-password/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center bg-[#0a2f7a] px-4 py-8 text-white">
          <div className="w-full max-w-[440px] rounded-lg border border-white/25 bg-white/10 p-6 text-center backdrop-blur-sm">
            <p className="text-[18px] font-semibold">Preparing password reset</p>
            <p className="mt-2 text-[13px] leading-[1.55] text-[#d9e7ff]">
              Please wait while we verify your recovery link.
            </p>
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
