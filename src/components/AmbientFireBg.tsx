"use client";

const ORBS = [
  { size: 450, top: "-5%", left: "-12%", color: "#E8622A", duration: 8, delay: 0   },
  { size: 320, top: "60%", left: "78%",  color: "#C8922A", duration: 7, delay: 2.5 },
  { size: 220, top: "42%", left: "-6%",  color: "#FF4500", duration: 6, delay: 4   },
];

const SLOW_EMBERS = Array.from({ length: 8 }, (_, i) => ({
  size:     3 + (i * 2.3) % 7,
  left:     i % 2 === 0
    ? 4  + (i * 5.7) % 18   // left edge (4–22%)
    : 76 + (i * 4.9) % 20,  // right edge (76–96%)
  bottom:   3  + (i * 6.1) % 22,
  duration: 12 + (i * 1.2) % 6,
  delay:    (i * 2.1) % 10,
  drift:    (i % 2 === 0 ? 1 : -1) * (15 + (i * 7.3) % 32),
  color:    i % 3 === 0 ? "#C8922A" : i % 3 === 1 ? "#E8622A" : "#FF8C42",
  opacity:  0.2 + (i * 0.04) % 0.18,
}));

export default function AmbientFireBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Slowly breathing glow orbs — all screen sizes */}
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width:  `${orb.size}px`,
            height: `${orb.size}px`,
            top:    orb.top,
            left:   orb.left,
            background: orb.color,
            filter: "blur(100px)",
            animationName:           "slow-pulse-glow",
            animationDuration:       `${orb.duration}s`,
            animationDelay:          `${orb.delay}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
      ))}

      {/* Very slow rising embers — desktop only, biased to edges away from the form */}
      <div className="hidden md:block">
        {SLOW_EMBERS.map((e, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width:  `${e.size}px`,
              height: `${e.size}px`,
              background: e.color,
              left:    `${e.left}%`,
              bottom:  `${e.bottom}%`,
              opacity: e.opacity,
              boxShadow: `0 0 ${e.size * 2}px ${e.color}88`,
              animationName:           "slow-ember-rise",
              animationDuration:       `${e.duration}s`,
              animationDelay:          `${e.delay}s`,
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
              "--ember-drift": `${e.drift}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Faint flame watermark — desktop only */}
      <div
        className="hidden md:block absolute bottom-8 right-8 select-none"
        style={{ fontSize: "160px", opacity: 0.035, lineHeight: 1 }}
      >
        🔥
      </div>
    </div>
  );
}
