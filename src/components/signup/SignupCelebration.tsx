import { useEffect, useMemo, useState } from "react";

const BALLOON_COLORS = [
  "#0F766E",
  "#14B8A6",
  "#0D9488",
  "#8FCA4A",
  "#65A30D",
  "#38BDF8",
  "#F59E0B",
  "#F472B6",
  "#A78BFA",
  "#FB7185",
];
const CONFETTI_COLORS = [
  "#0F766E",
  "#8FCA4A",
  "#38BDF8",
  "#FBBF24",
  "#FB7185",
  "#A78BFA",
  "#34D399",
  "#F97316",
  "#60A5FA",
  "#E879F9",
];

type Balloon = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  scale: number;
  drift: string;
};

type Piece = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  rotate: number;
  size: number;
  round: boolean;
  x: string;
};

type Burst = {
  id: number;
  left: string;
  top: string;
  delay: string;
  color: string;
};

/**
 * Bigger celebration on signup success — dense balloons, confetti, and firework bursts.
 * Honors prefers-reduced-motion and clears itself after the show.
 */
export function SignupCelebration({ active = true }: { active?: boolean }) {
  const [show, setShow] = useState(active);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!active || reduced) {
      setShow(false);
      return;
    }
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 7800);
    return () => window.clearTimeout(t);
  }, [active, reduced]);

  const balloons = useMemo<Balloon[]>(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${2 + ((i * 5.5) % 96)}%`,
        delay: `${0.02 + (i % 9) * 0.11}s`,
        duration: `${3.2 + (i % 5) * 0.55}s`,
        color: BALLOON_COLORS[i % BALLOON_COLORS.length]!,
        scale: 0.7 + (i % 5) * 0.12,
        drift: `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 6) * 6)}px`,
      })),
    [],
  );

  const confetti = useMemo<Piece[]>(
    () =>
      Array.from({ length: 72 }, (_, i) => ({
        id: i,
        left: `${(i * 13) % 100}%`,
        delay: `${(i % 14) * 0.06}s`,
        duration: `${2.0 + (i % 6) * 0.4}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
        rotate: (i * 47) % 360,
        size: 4 + (i % 5),
        round: i % 3 === 0,
        x: `${(i % 2 === 0 ? 1 : -1) * (18 + (i % 7) * 10)}px`,
      })),
    [],
  );

  const bursts = useMemo<Burst[]>(
    () => [
      { id: 0, left: "18%", top: "22%", delay: "0.15s", color: "#8FCA4A" },
      { id: 1, left: "78%", top: "18%", delay: "0.45s", color: "#14B8A6" },
      { id: 2, left: "50%", top: "12%", delay: "0.75s", color: "#F59E0B" },
      { id: 3, left: "30%", top: "38%", delay: "1.1s", color: "#38BDF8" },
      { id: 4, left: "68%", top: "34%", delay: "1.4s", color: "#F472B6" },
      { id: 5, left: "12%", top: "48%", delay: "1.85s", color: "#A78BFA" },
      { id: 6, left: "88%", top: "42%", delay: "2.15s", color: "#FB7185" },
    ],
    [],
  );

  if (!show || reduced) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes feezo-balloon-rise {
          0% { transform: translate3d(0, 115vh, 0) scale(var(--s, 1)); opacity: 0; }
          6% { opacity: 1; }
          100% { transform: translate3d(var(--drift, 0), -35vh, 0) scale(var(--s, 1)); opacity: 0.1; }
        }
        @keyframes feezo-confetti-fall {
          0% { transform: translate3d(0, -14vh, 0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translate3d(var(--x, 0), 112vh, 0) rotate(900deg); opacity: 0; }
        }
        @keyframes feezo-burst {
          0% { transform: scale(0.15); opacity: 0; }
          18% { opacity: 1; }
          100% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes feezo-spark {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx), var(--sy)) scale(0.15); opacity: 0; }
        }
      `}</style>

      {bursts.map((burst) => (
        <span
          key={`fw-${burst.id}`}
          className="absolute"
          style={{ left: burst.left, top: burst.top }}
        >
          <span
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${burst.color}55 0%, transparent 70%)`,
              animation: `feezo-burst 1.1s ${burst.delay} ease-out forwards`,
            }}
          />
          {Array.from({ length: 14 }, (_, s) => {
            const angle = (s / 14) * Math.PI * 2;
            const dist = 42 + (s % 3) * 14;
            return (
              <span
                key={s}
                className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  background: s % 2 === 0 ? burst.color : "#fff",
                  boxShadow: `0 0 6px ${burst.color}`,
                  ["--sx" as string]: `${Math.cos(angle) * dist}px`,
                  ["--sy" as string]: `${Math.sin(angle) * dist}px`,
                  animation: `feezo-spark 0.95s ${burst.delay} ease-out forwards`,
                }}
              />
            );
          })}
        </span>
      ))}

      {balloons.map((b) => (
        <span
          key={`b-${b.id}`}
          className="absolute bottom-0 will-change-transform"
          style={{
            left: b.left,
            ["--s" as string]: b.scale,
            ["--drift" as string]: b.drift,
            animation: `feezo-balloon-rise ${b.duration} ${b.delay} ease-out forwards`,
          }}
        >
          <BalloonSvg color={b.color} />
        </span>
      ))}

      {confetti.map((p) => (
        <span
          key={`c-${p.id}`}
          className="absolute top-0 will-change-transform"
          style={{
            left: p.left,
            width: p.size,
            height: p.round ? p.size : p.size * 1.7,
            borderRadius: p.round ? "999px" : "2px",
            background: p.color,
            ["--x" as string]: p.x,
            animation: `feezo-confetti-fall ${p.duration} ${p.delay} linear forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function BalloonSvg({ color }: { color: string }) {
  return (
    <svg width="42" height="60" viewBox="0 0 36 52" fill="none">
      <ellipse cx="18" cy="18" rx="14" ry="17" fill={color} />
      <ellipse cx="12" cy="11" rx="4" ry="6" fill="white" opacity="0.28" />
      <path d="M18 35 L16 38 L20 38 Z" fill={color} />
      <path
        d="M18 38 C16 42, 20 44, 18 48"
        stroke="#94A3B8"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
