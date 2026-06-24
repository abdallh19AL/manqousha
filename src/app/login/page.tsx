"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

const C = {
  bg:      "#FBF7F2",
  surface: "#F7F5F2",
  border:  "#E5E0D8",
  primary: "#E8622A",
  gold:    "#C8922A",
  text:    "#1A1208",
  muted:   "#6B5B47",
  faint:   "#9B8B73",
} as const;

const inputStyle: React.CSSProperties = {
  width:        "100%",
  background:   "#FFFFFF",
  border:       "1px solid #E5E0D8",
  borderRadius: "12px",
  padding:      "12px 16px",
  color:        "#1A1208",
  fontSize:     "14px",
  outline:      "none",
  fontFamily:   "inherit",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email,          setEmail]         = useState("");
  const [password,       setPassword]      = useState("");
  const [showPw,         setShowPw]        = useState(false);
  const [loading,        setLoading]       = useState(false);
  const [googleLoading,  setGoogleLoading] = useState(false);
  const [error,          setError]         = useState("");
  const [redirectTo,     setRedirectTo]    = useState("/");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get("redirect") ?? "/");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } else {
      router.replace(redirectTo);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options:  { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <main
      className="min-h-screen overflow-x-hidden flex flex-col"
      style={{ background: C.bg, color: C.text }}
    >
      <Navbar variant="light" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Back link */}
          <Link
            href="/"
            className="inline-block mb-8 text-sm font-bold transition-colors"
            style={{ color: C.faint }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
          >
            العودة للرئيسية
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3 inline-block select-none">🔥</div>
            <h1
              className="text-3xl font-black mb-2 leading-[1.3] pb-1"
              style={{
                background:           `linear-gradient(135deg, ${C.primary} 0%, ${C.gold} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
              }}
            >
              أهلاً بك مجدداً
            </h1>
            <p className="text-sm" style={{ color: C.muted }}>سجّل دخولك للوصول لطلباتك</p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: C.surface, border: `1px solid ${C.border}` }}
          >
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                border:     `1px solid ${C.border}`,
                color:      C.text,
                background: googleLoading ? C.border : C.bg,
              }}
              onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.borderColor = "#E8622A55"; }}
              onMouseLeave={(e) => { if (!googleLoading) e.currentTarget.style.borderColor = C.border; }}
            >
              <GoogleIcon />
              {googleLoading ? "جارٍ التحويل..." : "تسجيل الدخول عبر Google"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: C.border }} />
              <span className="text-xs font-bold" style={{ color: C.faint }}>أو</span>
              <div className="flex-1 h-px" style={{ background: C.border }} />
            </div>

            {/* Email/Password form */}
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: C.muted }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: C.muted }}>
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    required
                    style={{ ...inputStyle, paddingLeft: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute top-1/2 -translate-y-1/2 left-3 transition-colors"
                    style={{ color: C.faint }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: "#FFF0F0", border: "1px solid #E8404033", color: "#C52020" }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all active:scale-95"
                style={
                  loading
                    ? { background: C.border, color: C.faint, cursor: "wait" }
                    : { background: `linear-gradient(135deg, ${C.primary}, ${C.gold})`, boxShadow: `0 4px 16px ${C.primary}44` }
                }
              >
                {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </form>
          </div>

          {/* Footer links */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm" style={{ color: C.muted }}>
              ليس لديك حساب؟{" "}
              <Link
                href="/signup"
                className="font-bold transition-colors"
                style={{ color: C.primary }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FF7340")}
                onMouseLeave={(e) => (e.currentTarget.style.color = C.primary)}
              >
                سجّل الآن
              </Link>
            </p>
            <Link
              href="/"
              className="block text-sm transition-colors"
              style={{ color: C.faint }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.muted)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.faint)}
            >
              المتابعة كزائر ←
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
