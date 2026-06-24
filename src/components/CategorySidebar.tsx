"use client";

import {
  Utensils, Sandwich, Pizza, Cookie, Flame, UtensilsCrossed,
  Star, Croissant, Plus, IceCream, CupSoda,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const CATEGORY_STYLE: Record<string, { accent: string; Icon: LucideIcon }> = {
  "الكل":            { accent: "#E8622A", Icon: Utensils        },
  "شاورما":          { accent: "#E8622A", Icon: Sandwich        },
  "وجبات شاورما":   { accent: "#E8622A", Icon: Sandwich        },
  "بيتزا":           { accent: "#D95820", Icon: Pizza           },
  "مناقيش":          { accent: "#C8922A", Icon: Cookie          },
  "مناقيش مميزة":   { accent: "#E8622A", Icon: Flame           },
  "رولات":           { accent: "#C8A030", Icon: UtensilsCrossed },
  "رولات مميزة":    { accent: "#D4A820", Icon: Star            },
  "فطائر":           { accent: "#C87820", Icon: Croissant       },
  "مقبلات وإضافات": { accent: "#A07848", Icon: Plus            },
  "حلويات":          { accent: "#C87060", Icon: IceCream        },
  "مشروبات":         { accent: "#40A870", Icon: CupSoda         },
};
const DEFAULT_STYLE = { accent: "#C8922A", Icon: Utensils };

interface Props {
  categories: string[];
  active: string;
  onSelect: (cat: string) => void;
  countFor: (cat: string) => number;
}

export default function CategorySidebar({ categories, active, onSelect }: Props) {
  return (
    <aside
      className="hidden lg:flex flex-col items-center gap-3 w-20 shrink-0 sticky self-start py-1"
      style={{ top: "136px" }}
    >
      {categories.map((cat) => {
        const isActive = active === cat;
        const { accent, Icon } = CATEGORY_STYLE[cat] ?? DEFAULT_STYLE;

        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            aria-pressed={isActive}
            className="flex flex-col items-center gap-1 w-full select-none"
            style={{ transition: "transform 0.15s ease" }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.transform = "scale(1.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {/* Icon badge */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={
                isActive
                  ? {
                      background: accent,
                      color:      "#FFFFFF",
                      boxShadow:  `0 4px 12px ${accent}50`,
                    }
                  : {
                      background: `${accent}18`,
                      color:      accent,
                    }
              }
            >
              <Icon className="w-5 h-5" />
            </div>

            {/* Label */}
            <span
              className="text-center leading-tight w-full break-words"
              style={{
                fontSize:   "10px",
                color:      isActive ? accent : "#6B5B47",
                fontWeight: isActive ? 900 : 700,
              }}
            >
              {cat}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
