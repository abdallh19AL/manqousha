"use client";
import { useEffect } from "react";

export default function PageDecorations() {
  useEffect(() => {
    const styleId = "page-decos-style";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .page-with-decos {
        background-image:
          url('/decorations/olive-branch.png'),
          url('/decorations/wheat-stalks.png');
        background-repeat: no-repeat, no-repeat;
        background-attachment: fixed, fixed;
        background-position:
          right -2vw top 60px,
          left -2vw bottom -2vh;
        background-size:
          clamp(250px, 22vw, 450px),
          clamp(200px, 18vw, 350px);
      }
      @media (max-width: 768px) {
        .page-with-decos { background-image: none; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById(styleId)?.remove(); };
  }, []);
  return null;
}
