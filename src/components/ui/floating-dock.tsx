/**
 * Note: Use position fixed according to your needs
 * Desktop navbar is better positioned at the bottom
 * Mobile navbar is better positioned at bottom right.
 **/

import { Link } from "@tanstack/react-router";
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import * as React from "react";
import { useRef, useState } from "react";

import { cn, glassPanelClass } from "@/lib/utils";

export type FloatingDockItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  /** Renders a brand/tile (e.g. school initials) instead of a white icon plate. */
  brand?: boolean;
};

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
  desktopOnly = false,
}: {
  items: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
  /** Skip the built-in mobile toggle (use when a MobileTabBar already exists). */
  desktopOnly?: boolean;
}) => {
  return (
    <>
      <FloatingDockDesktop
        items={items}
        className={desktopClassName}
        alwaysVisible={desktopOnly}
      />
      {!desktopOnly && (
        <FloatingDockMobile items={items} className={mobileClassName} />
      )}
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: { delay: idx * 0.05 },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <Link
                  to={item.href}
                  aria-label={item.title}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm",
                    item.active && "ring-2 ring-[#2563EB]/40",
                  )}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Open navigation"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm"
      >
        <span className="text-[11px] font-bold text-slate-600">•••</span>
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
  alwaysVisible = false,
}: {
  items: FloatingDockItem[];
  className?: string;
  alwaysVisible?: boolean;
}) => {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        glassPanelClass,
        "mx-auto h-16 items-end gap-3 rounded-xl border border-white/70 bg-white/55 px-3 pb-2.5 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur-2xl",
        alwaysVisible ? "flex" : "hidden md:flex",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  active,
  brand,
}: {
  mouseX: MotionValue<number>;
  title: string;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  brand?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [44, 72, 44]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [44, 72, 44]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 34, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 34, 20]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);
  const isAppRoute = href.startsWith("/");

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-lg border shadow-[0_6px_18px_-10px_rgba(15,23,42,0.45)]",
        brand
          ? "border-white/40 bg-gradient-to-br from-[#2563EB] to-[#4C69A4] text-white"
          : "border-white/70 bg-gradient-to-br from-white/95 to-white/70",
        active && "ring-2 ring-[#2563EB]/40",
      )}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="absolute -top-9 left-1/2 z-50 w-fit rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold whitespace-pre text-white shadow-lg"
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center"
      >
        {icon}
      </motion.div>
      <span
        className={cn(
          "absolute -bottom-1.5 h-1 w-1 rounded-full bg-slate-800 transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </motion.div>
  );

  if (isAppRoute) {
    return (
      <Link to={href} aria-label={title} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} aria-label={title} aria-current={active ? "page" : undefined}>
      {content}
    </a>
  );
}
