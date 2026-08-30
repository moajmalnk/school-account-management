import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { FeezoBrand } from "@/components/brand/FeezoBrand";
import { SIGNUP_STEPS } from "@/lib/signup-content";
import { cn } from "@/lib/utils";

export function SignupShell({
  step,
  children,
  title = "Create Your School",
  subtitle = "Set up your Feezo Edu Books account in a few simple steps.",
}: {
  step: number;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-dvh bg-[#F4F6F9] px-3 py-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-xl border border-white/70 bg-white/80 px-3 py-2.5 shadow-[0_14px_44px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-opacity hover:opacity-90"
          >
            <FeezoBrand markClassName="h-9 w-9" />
          </Link>
          <Link
            to="/"
            aria-label="Close signup"
            className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-black/55 transition-colors hover:text-black"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-[28px] border border-white/80 bg-white px-4 py-6 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6BA832]">
            Feezo Edu Books Registration
          </p>
          <h1 className="mt-1.5 text-[1.55rem] font-semibold tracking-tight text-black sm:text-[1.85rem]">
            {title}
          </h1>
          <p className="mt-1.5 text-[14px] text-black/55">{subtitle}</p>

          <ol className="mt-6 flex items-center gap-0 overflow-x-auto pb-1">
            {SIGNUP_STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              const clickable = done || active;
              const marker = (
                <>
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold",
                      done || active ? "bg-[#6BA832] text-white" : "bg-[#E8EEF5] text-black/45",
                    )}
                  >
                    {s.id}
                  </span>
                  <span
                    className={cn(
                      "hidden text-center text-[10px] font-semibold sm:block",
                      active || done ? "text-black/75" : "text-black/40",
                    )}
                  >
                    {s.label}
                  </span>
                </>
              );
              return (
                <li key={s.id} className="flex min-w-0 flex-1 items-center">
                  {clickable ? (
                    <Link
                      to={"/signup/$step" as never}
                      params={{ step: s.slug } as never}
                      className="flex min-w-0 flex-col items-center gap-1.5"
                      aria-current={active ? "step" : undefined}
                    >
                      {marker}
                    </Link>
                  ) : (
                    <div className="flex min-w-0 flex-col items-center gap-1.5">{marker}</div>
                  )}
                  {i < SIGNUP_STEPS.length - 1 ? (
                    <div
                      className={cn(
                        "mx-1 mb-4 h-0.5 min-w-[12px] flex-1 sm:mb-5",
                        step > s.id ? "bg-[#6BA832]" : "bg-[#E8EEF5]",
                      )}
                      aria-hidden
                    />
                  ) : null}
                </li>
              );
            })}
          </ol>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-5 text-center text-[12px] text-black/45">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[#0F766E] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-semibold text-black/80">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  );
}

export const fieldClass =
  "h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[14px] text-black outline-none transition-[border-color,box-shadow] placeholder:text-black/35 focus:border-[#0F766E]/50 focus:ring-2 focus:ring-[#0F766E]/15";

/** Match signup text inputs for Radix Select triggers. */
export const signupSelectTriggerClass =
  "h-11 w-full rounded-xl border border-black/10 bg-white px-3.5 text-[14px] font-normal text-black shadow-none focus:border-[#0F766E]/50 focus:ring-2 focus:ring-[#0F766E]/15 data-[placeholder]:text-black/35";

export const signupSelectContentClass =
  "z-[80] max-h-64 rounded-xl border border-black/10 bg-white text-black shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]";

export const signupSelectItemClass =
  "cursor-pointer rounded-lg py-2 pl-3 pr-8 text-[13.5px] focus:bg-[#F4FBF0] focus:text-black";
