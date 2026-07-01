import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const toneClasses = {
  white: "bg-white text-black border border-[#E5E5E5]",
  lime: "bg-[#C7F33C] text-black border border-black/0",
  limePale: "bg-[#E1F2AE] text-black border border-black/0",
  black: "bg-black text-white border border-black"
};
const cornerClasses = {
  tl: "organic-corner-tl",
  tr: "organic-corner-tr",
  bl: "organic-corner-bl",
  br: "organic-corner-br"
};
export {
  cornerClasses as a,
  cn as c,
  toneClasses as t
};
