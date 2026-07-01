import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as cn, a as cornerClasses, t as toneClasses } from "./utils-DO8q3wGq.mjs";
import { A as ArrowUpRight } from "../_libs/lucide-react.mjs";
const SHADOW = "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-32px_rgba(0,0,0,0.18)]";
const contentPadByCorner = {
  tr: "pr-14",
  tl: "pl-14",
  br: "pr-14 pb-14",
  bl: "pl-14 pb-14"
};
function OrganicCard({
  tone = "white",
  cornerSide = "tr",
  arrow = false,
  onArrowClick,
  arrowAriaLabel = "Open detail",
  padded = false,
  className,
  children,
  ...rest
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ...rest,
      className: cn(
        "organic-card relative",
        toneClasses[tone],
        cornerClasses[cornerSide],
        SHADOW,
        padded ? "p-6" : "",
        className
      ),
      children: [
        arrow ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("relative", contentPadByCorner[cornerSide]), children }) : children,
        arrow && /* @__PURE__ */ jsxRuntimeExports.jsx(
          ArrowGlyph,
          {
            tone,
            cornerSide,
            onClick: onArrowClick,
            "aria-label": arrowAriaLabel
          }
        )
      ]
    }
  );
}
function ArrowGlyph({
  tone = "white",
  cornerSide = "tr",
  className,
  onClick,
  ...rest
}) {
  const isOnLime = tone === "lime";
  const isOnBlack = tone === "black";
  const positionByCorner = {
    tr: "absolute right-4 top-4",
    tl: "absolute left-4 top-4",
    bl: "absolute left-4 bottom-4",
    br: "absolute right-4 bottom-4"
  };
  const inkClass = isOnLime ? "bg-black text-white hover:bg-black/85" : isOnBlack ? "bg-white text-black hover:bg-white/90" : "bg-white text-black border border-black hover:bg-black hover:text-white";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: (e) => {
        e.stopPropagation();
        onClick?.(e);
      },
      className: cn(
        positionByCorner[cornerSide],
        "z-10 grid h-10 w-10 place-items-center rounded-full transition-colors",
        "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        inkClass,
        className
      ),
      ...rest,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "h-4 w-4", strokeWidth: 2.25 })
    }
  );
}
export {
  OrganicCard as O
};
