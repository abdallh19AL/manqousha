import Link from "next/link";
import { Share2, MessageCircle, Phone, MapPin, Clock } from "lucide-react";

export default function Footer({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const isLight = variant === "light";

  const bg          = isLight ? "#F7F5F2" : "#0A0704";
  const borderTop   = isLight ? "1px solid #E5E0D8" : "1px solid #2A1E10";
  const headingClr  = isLight ? "#C8922A" : "#C8922A";
  const mutedClr    = isLight ? "#6B5B47" : "#A08060";
  const hoverClr    = isLight ? "#E8622A" : "#F5E6C8";
  const iconBg      = isLight ? "#FFFFFF"  : "#1A1208";
  const iconBorder  = isLight ? "#E5E0D8" : "#2A1E10";
  const bottomBorder = isLight ? "1px solid #E5E0D8" : "1px solid #2A1E10";
  const bottomTxt   = isLight ? "#9B8B73" : "#5C4030";

  return (
    <footer className="relative mt-auto" style={{ background: "transparent", borderTop }}>
      {/* Top accent line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, #E8622A66, #C8922A88, #E8622A66, transparent)",
          boxShadow: isLight ? "none" : "0 0 20px 4px #E8622A22",
        }}
      />

      <div className="max-w-5xl mx-auto px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">

          {/* Col 1 — Brand */}
          <div className="text-center md:text-right">
            <div className="flex items-center gap-2 justify-center md:justify-end mb-3">
              <span className="text-2xl">🔥</span>
              <span
                className="text-xl font-black"
                style={{
                  background:           "linear-gradient(135deg, #1A1208 0%, #E8622A 55%, #C8922A 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor:  "transparent",
                  backgroundClip:       "text",
                }}
              >
                منقوشة و نار
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-4" style={{ color: mutedClr }}>
              مناقيش وفطائر طازجة كل يوم — محضّرة بحب وعلى أصولها من أول لقمة
            </p>
            {/* Social icons */}
            <div className="flex gap-3 justify-center md:justify-end">
              {/* Share */}
              <button
                aria-label="مشاركة"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "منقوشة و نار", url: window.location.origin });
                  } else {
                    navigator.clipboard.writeText(window.location.origin);
                  }
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: iconBg, border: `1px solid ${iconBorder}`, color: mutedClr }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E8622A55";
                  e.currentTarget.style.color       = "#E8622A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = iconBorder;
                  e.currentTarget.style.color       = mutedClr;
                }}
              >
                <Share2 className="w-4 h-4" />
              </button>
              {/* WhatsApp */}
              <a
                href="https://wa.me/962799330019"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: iconBg, border: `1px solid ${iconBorder}`, color: mutedClr }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E8622A55";
                  e.currentTarget.style.color       = "#E8622A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = iconBorder;
                  e.currentTarget.style.color       = mutedClr;
                }}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2 — Quick links */}
          <div className="text-center md:text-right">
            <h4 className="text-sm font-black mb-4" style={{ color: headingClr }}>
              روابط سريعة
            </h4>
            <ul className="space-y-2.5">
              {[
                { href: "/",       label: "القائمة" },
                { href: "/offers", label: "العروض"  },
                { href: "/cart",   label: "سلتي"    },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors"
                    style={{ color: mutedClr }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = hoverClr)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = mutedClr)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Info */}
          <div className="text-center md:text-right">
            <h4 className="text-sm font-black mb-4" style={{ color: headingClr }}>
              معلومات التواصل
            </h4>
            <ul className="space-y-2.5 text-sm" style={{ color: mutedClr }}>
              <li>
                <a
                  href="https://maps.app.goo.gl/FYUCVwha6FFQm1Zt7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 justify-center md:justify-end transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.color = hoverClr)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = mutedClr)}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>عمّان، الأردن</span>
                </a>
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-end">
                <Phone className="w-4 h-4 shrink-0" />
                <a
                  href="tel:+962799330019"
                  dir="ltr"
                  className="transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.color = hoverClr)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = mutedClr)}
                >
                  079 933 0019
                </a>
              </li>
              <li className="flex items-center gap-2 justify-center md:justify-end">
                <Clock className="w-4 h-4 shrink-0" />
                <span>١٠:٠٠ ص — ١٢:٠٠ م</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-5 text-center text-xs"
          style={{ borderTop: bottomBorder, color: bottomTxt }}
        >
          © {new Date().getFullYear()} منقوشة و نار — جميع الحقوق محفوظة 🔥
        </div>
      </div>
    </footer>
  );
}
