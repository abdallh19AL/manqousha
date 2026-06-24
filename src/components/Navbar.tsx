"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Package, ShoppingCart, User as UserIcon } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function Navbar({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const getItemCount = useCartStore((s) => s.getItemCount);
  const { user, loading: authLoading } = useAuth();

  const [mounted,  setMounted]  = useState(false);
  const [count,    setCount]    = useState(0);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setCount(getItemCount());
    return useCartStore.subscribe((s) => setCount(s.getItemCount()));
  }, [getItemCount]);

  useEffect(() => {
    if (!dropOpen) return;
    function handleOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropOpen]);

  const handleLogout = async () => {
    setDropOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName = user
    ? (
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        "مستخدم"
      ).split(" ")[0]
    : "";
  const avatarLetter = displayName[0]?.toUpperCase() ?? "؟";

  const isLight = variant === "light";

  // Theme tokens
  const desktopBg      = isLight ? "rgba(255,255,255,0.94)" : "rgba(15,10,5,0.93)";
  const activeLinkTxt  = isLight ? "#E8622A"   : "#F5E6C8";
  const activeLinkBg   = isLight ? "#E8622A10" : "linear-gradient(135deg, #E8622A1A, #C8922A14)";
  const inactiveTxt    = isLight ? "#6B5B47"   : "#A08060";
  const hoverTxt       = isLight ? "#1A1208"   : "#F5E6C8";
  const underlineStyle = { background: "linear-gradient(90deg, #E8622A, #C8922A)" };
  const logoFilter     = isLight
    ? "drop-shadow(0 2px 6px rgba(232,98,42,0.20))"
    : "drop-shadow(0 0 8px rgba(232,98,42,0.7)) brightness(1.1)";

  // Dropdown (always white card on light; dark card on dark)
  const dropBg     = isLight ? "#FFFFFF"  : "#1A1208";
  const dropBorder = isLight ? "#E5E0D8"  : "#2A1E10";
  const dropShadow = isLight ? "0 8px 24px rgba(0,0,0,0.12)" : "0 8px 24px #00000099";
  const dropItemTxt   = isLight ? "#1A1208" : "#F5E6C8";
  const dropItemHover = isLight ? "#F7F5F2" : "#2A1E10";

  // User button
  const userBtnBg      = isLight ? "#F7F5F2" : "#1A1208";
  const userBtnBorder  = isLight ? "#E5E0D8" : "#2A1E10";
  const userBtnHover   = isLight ? "#E8622A33" : "#E8622A44";
  const userNameTxt    = isLight ? "#1A1208" : "#F5E6C8";

  const navLinks = isLight
    ? [
        { href: "/",        label: "القائمة" },
        { href: "/offers",  label: "العروض"  },
        { href: "/combos",  label: "كومبو"   },
      ]
    : [
        { href: "/",     label: "القائمة" },
        { href: "/cart", label: "سلتي"    },
      ];

  const mobileLinks = [
    { href: "/",       label: "القائمة", icon: "🍽️" },
    { href: "/offers", label: "العروض",  icon: "🔥" },
    { href: "/combos", label: "كومبو",   icon: "🍕" },
    { href: "/cart",   label: "سلتي",    icon: "🛒" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* ── Desktop top bar ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 hidden md:block backdrop-blur-md"
        style={{ background: "transparent", borderBottom: isLight ? "1px solid #E5E0D8" : "none" }}
      >
        {/* Dark theme bottom gradient line */}
        {!isLight && (
          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #E8622A55, #C8922A77, #E8622A55, transparent)" }}
          />
        )}

        {isLight ? (
          /* Light variant: 3-column — logo+name | nav links | cart+user */
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
            {/* RIGHT (RTL start): Logo + brand name */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image
                src="/logo.png"
                width={96}
                height={52}
                alt="منقوشة و نار"
                className="object-contain rounded-lg"
                style={{ filter: logoFilter }}
              />
              <div className="hidden xl:flex flex-col leading-none">
                <span className="text-base font-black" style={{ color: "#1A1208" }}>منقوشة و نار</span>
                <span className="text-[10px] font-bold tracking-wide" style={{ color: "#E8622A" }}>🔥 طازج كل يوم</span>
              </div>
            </Link>

            {/* CENTER: nav links (flex-1 on both sides to center) */}
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="relative px-5 py-2 rounded-xl text-sm font-bold transition-all"
                  style={
                    isActive(href)
                      ? { color: activeLinkTxt }
                      : { color: inactiveTxt }
                  }
                  onMouseEnter={(e) => { if (!isActive(href)) e.currentTarget.style.color = hoverTxt; }}
                  onMouseLeave={(e) => { if (!isActive(href)) e.currentTarget.style.color = inactiveTxt; }}
                >
                  {label}
                  {isActive(href) && (
                    <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full" style={underlineStyle} />
                  )}
                </Link>
              ))}
            </div>
            <div className="flex-1" />

            {/* LEFT (RTL end): Cart + User */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Cart button */}
              {mounted && (
                <Link
                  href="/cart"
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold transition-all"
                  style={
                    isActive("/cart")
                      ? { color: activeLinkTxt, background: "#E8622A10" }
                      : { color: inactiveTxt }
                  }
                  onMouseEnter={(e) => { if (!isActive("/cart")) { e.currentTarget.style.color = hoverTxt; e.currentTarget.style.background = "#F7F5F2"; } }}
                  onMouseLeave={(e) => { if (!isActive("/cart")) { e.currentTarget.style.color = inactiveTxt; e.currentTarget.style.background = "transparent"; } }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>سلتي</span>
                  {count > 0 && (
                    <span
                      className="flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-black"
                      style={{ background: "#E8622A" }}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              )}

              {/* Auth */}
              {mounted && !authLoading && (
                user ? (
                  <div className="relative" ref={dropRef}>
                    <button
                      onClick={() => setDropOpen((o) => !o)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                      style={{ border: `1px solid ${userBtnBorder}`, background: userBtnBg }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = userBtnHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = userBtnBorder)}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: "linear-gradient(135deg, #E8622A, #C8922A)", color: "#fff" }}
                      >
                        {avatarLetter}
                      </span>
                      <span className="text-sm font-bold max-w-[80px] truncate" style={{ color: userNameTxt }}>
                        {displayName}
                      </span>
                      <ChevronDown
                        className="w-3 h-3 shrink-0 transition-transform"
                        style={{ color: inactiveTxt, transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    {dropOpen && (
                      <div
                        className="absolute left-0 top-full mt-1 min-w-[150px] rounded-xl overflow-hidden z-10"
                        style={{ background: dropBg, border: `1px solid ${dropBorder}`, boxShadow: dropShadow }}
                      >
                        <Link
                          href="/orders?tab=points"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors"
                          style={{ color: "#C8922A" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = dropItemHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span>⭐</span>
                          <span>نقاطي</span>
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors"
                          style={{ color: dropItemTxt }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = dropItemHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Package className="w-4 h-4 shrink-0" style={{ color: "#C8922A" }} />
                          طلباتي
                        </Link>
                        <div style={{ borderTop: `1px solid ${dropBorder}` }}>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-right transition-colors"
                            style={{ color: "#E84040" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = dropItemHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            تسجيل خروج
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "#E8622A1A", color: "#E8622A", border: "1px solid #E8622A33" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E8622A77")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E8622A33")}
                  >
                    تسجيل الدخول
                  </Link>
                )
              )}
            </div>
          </div>
        ) : (
          /* Dark variant: original layout */
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center shrink-0">
              <div className="flex items-center py-1">
                <Image
                  src="/logo.png"
                  width={110}
                  height={60}
                  alt="منقوشة و نار"
                  className="object-contain rounded-lg"
                  style={{ filter: logoFilter }}
                />
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="relative px-5 py-2 rounded-xl text-sm font-bold transition-all"
                  style={
                    isActive(href)
                      ? { background: activeLinkBg, color: activeLinkTxt }
                      : { color: inactiveTxt }
                  }
                  onMouseEnter={(e) => { if (!isActive(href)) e.currentTarget.style.color = hoverTxt; }}
                  onMouseLeave={(e) => { if (!isActive(href)) e.currentTarget.style.color = inactiveTxt; }}
                >
                  {label}
                  {isActive(href) && (
                    <span className="absolute inset-x-3 bottom-1 h-0.5 rounded-full" style={underlineStyle} />
                  )}
                  {href === "/cart" && mounted && count > 0 && (
                    <span
                      className="absolute -top-1 -left-1 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-black"
                      style={{ background: "#E8622A" }}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              ))}

              {mounted && !authLoading && (
                user ? (
                  <div className="relative mr-2" ref={dropRef}>
                    <button
                      onClick={() => setDropOpen((o) => !o)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
                      style={{ border: `1px solid ${userBtnBorder}`, background: userBtnBg }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = userBtnHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = userBtnBorder)}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: "linear-gradient(135deg, #E8622A, #C8922A)", color: "#fff" }}
                      >
                        {avatarLetter}
                      </span>
                      <span className="text-sm font-bold max-w-[80px] truncate" style={{ color: userNameTxt }}>
                        {displayName}
                      </span>
                      <ChevronDown
                        className="w-3 h-3 shrink-0 transition-transform"
                        style={{ color: inactiveTxt, transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>

                    {dropOpen && (
                      <div
                        className="absolute left-0 top-full mt-1 min-w-[150px] rounded-xl overflow-hidden z-10"
                        style={{ background: dropBg, border: `1px solid ${dropBorder}`, boxShadow: dropShadow }}
                      >
                        <Link
                          href="/orders?tab=points"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors"
                          style={{ color: "#C8922A" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = dropItemHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span>⭐</span>
                          <span>نقاطي</span>
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm font-bold transition-colors"
                          style={{ color: dropItemTxt }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = dropItemHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <Package className="w-4 h-4 shrink-0" style={{ color: "#C8922A" }} />
                          طلباتي
                        </Link>
                        <div style={{ borderTop: `1px solid ${dropBorder}` }}>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-right transition-colors"
                            style={{ color: "#E84040" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = dropItemHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            تسجيل خروج
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="mr-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{ background: "#E8622A1A", color: "#E8622A", border: "1px solid #E8622A33" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E8622A77")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E8622A33")}
                  >
                    تسجيل الدخول
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Mobile top bar ── */}
      <nav
        className="fixed top-0 inset-x-0 z-50 md:hidden backdrop-blur-md"
        style={{ background: "transparent", borderBottom: isLight ? "1px solid #E5E0D8" : "none" }}
      >
        {!isLight && (
          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #E8622A55, #C8922A77, #E8622A55, transparent)" }}
          />
        )}
        <div className="px-4 h-14 flex items-center justify-center">
          <Link href="/" className="flex items-center">
            <div className="flex items-center py-1">
              <Image
                src="/logo.png"
                width={110}
                height={60}
                alt="منقوشة و نار"
                className="object-contain rounded-lg"
                style={{ filter: logoFilter }}
              />
            </div>
          </Link>
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 flex md:hidden border-t"
        style={{ background: "#FFFFFF", borderColor: "#E5E0D8", boxShadow: "0 -2px 12px rgba(0,0,0,0.06)" }}
      >
        {mobileLinks.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 relative transition-all"
            style={{ color: isActive(href) ? "#E8622A" : "#9B8B73" }}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-xs font-bold">{label}</span>
            {isActive(href) && (
              <span
                className="absolute top-0 inset-x-5 h-0.5 rounded-b-full"
                style={{ background: "linear-gradient(90deg, #E8622A, #C8922A)" }}
              />
            )}
            {href === "/cart" && mounted && count > 0 && (
              <span
                className="absolute top-2 left-1/2 translate-x-3 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-black"
                style={{ background: "#E8622A" }}
              >
                {count}
              </span>
            )}
          </Link>
        ))}

        {/* Auth tab */}
        {mounted && (
          user ? (
            <Link
              href="/orders"
              className="flex-1 flex flex-col items-center py-3 gap-0.5 relative transition-all"
              style={{ color: isActive("/orders") ? "#E8622A" : "#9B8B73" }}
            >
              <Package className="w-5 h-5" />
              <span className="text-xs font-bold">طلباتي</span>
              {isActive("/orders") && (
                <span
                  className="absolute top-0 inset-x-5 h-0.5 rounded-b-full"
                  style={{ background: "linear-gradient(90deg, #E8622A, #C8922A)" }}
                />
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex-1 flex flex-col items-center py-3 gap-0.5 relative transition-all"
              style={{ color: isActive("/login") ? "#E8622A" : "#9B8B73" }}
            >
              <UserIcon className="w-5 h-5" />
              <span className="text-xs font-bold">دخول</span>
              {isActive("/login") && (
                <span
                  className="absolute top-0 inset-x-5 h-0.5 rounded-b-full"
                  style={{ background: "linear-gradient(90deg, #E8622A, #C8922A)" }}
                />
              )}
            </Link>
          )
        )}
      </div>
    </>
  );
}
