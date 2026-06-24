"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handle = async () => {
      // PKCE flow: exchange code for session
      const params = new URLSearchParams(window.location.search);
      const code   = params.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(window.location.href);
      }
      // For implicit flow, getSession processes the URL hash automatically
      await supabase.auth.getSession();
      router.replace("/");
    };
    handle();
  }, [router]);

  return (
    <main
      style={{ background: "#0F0A05", minHeight: "100vh" }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <div
        className="text-5xl select-none"
        style={{
          animationName:           "flame-flicker",
          animationDuration:       "2s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
        }}
      >
        🔥
      </div>
      <p className="text-sm font-bold" style={{ color: "#A08060" }}>جارٍ التحقق من هويتك...</p>
    </main>
  );
}
