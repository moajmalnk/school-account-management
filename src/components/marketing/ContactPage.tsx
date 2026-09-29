import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { TrialSignupLink } from "@/components/marketing/TrialSignupLink";
import { easeOutExpo } from "@/components/marketing/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { ApiError } from "@/lib/api/client";
import { CONTACT_TOPICS, apiSubmitContact, type ContactTopic } from "@/lib/api/contact";
import { useAuth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const C = BRAND.contact;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function whatsappUrl(text: string): string {
  return `https://wa.me/${C.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(C.mapQuery)}&z=11&output=embed`;
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.mapQuery)}`;

type Channel = {
  id: string;
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  href: string;
  cta: string;
  external?: boolean;
  copy?: string;
  tone: string;
};

const CHANNELS: Channel[] = [
  {
    id: "email",
    label: "Email",
    value: C.email,
    hint: "Sales, onboarding & general questions",
    icon: <Mail className="h-5 w-5" aria-hidden />,
    href: `mailto:${C.email}?subject=${encodeURIComponent("Enquiry about Feezo")}`,
    cta: "Write to us",
    copy: C.email,
    tone: "bg-sky-50 text-sky-600",
  },
  {
    id: "voice",
    label: "Voice",
    value: C.phoneDisplay,
    hint: C.hours,
    icon: <Phone className="h-5 w-5" aria-hidden />,
    href: `tel:${C.phoneE164}`,
    cta: "Call now",
    copy: C.phoneE164,
    tone: "bg-amber-50 text-amber-600",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: C.whatsappDisplay,
    hint: "Fastest way to reach the team",
    icon: <WhatsAppIcon className="h-5 w-5" />,
    href: whatsappUrl("Hi Feezo team, I'd like to know more about Feezo for my school."),
    cta: "Start chat",
    external: true,
    copy: C.phoneE164,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    id: "global",
    label: "Global",
    value: C.location,
    hint: `Serving schools across ${C.country} & beyond`,
    icon: <Globe2 className="h-5 w-5" aria-hidden />,
    href: MAP_LINK,
    cta: "View on map",
    external: true,
    tone: "bg-violet-50 text-violet-600",
  },
];

const FAQS = [
  {
    q: "How quickly will I hear back?",
    a: `${C.responseTime}. During working hours (${C.hours}) WhatsApp and phone are usually answered within minutes.`,
  },
  {
    q: "Can I see Feezo before signing up?",
    a: "Yes — choose “Book a demo” in the form and we'll walk your team through fees, receipts and reports on a short video call. You can also start the 14-day free trial right away; no card is needed.",
  },
  {
    q: "Do you help migrate our existing fee data?",
    a: "We do. Share your current student and fee lists (Excel or CSV) and our onboarding team will help you import them during the trial.",
  },
  {
    q: "I already use Feezo and need help.",
    a: `Pick “Product support” in the form, or email ${BRAND.legal.supportEmail}. Signed-in admins can also raise a ticket from Settings → Support inside the app.`,
  },
];

export function ContactPage() {
  const reduce = useReducedMotion();

  useEffect(() => {
    const prev = document.title;
    document.title = `Contact · ${BRAND.name}`;
    return () => {
      document.title = prev;
    };
  }, []);

  const fadeUp = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-40px" },
          transition: { duration: 0.55, ease: easeOutExpo, delay },
        };

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(143,202,74,0.18) 0%, rgba(143,202,74,0.06) 45%, transparent 75%)",
        }}
      />

      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-10 text-center sm:px-8 sm:pt-16 lg:px-10">
        <motion.p
          {...fadeUp()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mkt-green)]/25 bg-white/80 px-3 py-1 text-[12px] font-semibold text-[var(--mkt-green-deep)] shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          We're here to help
        </motion.p>
        <motion.h1
          {...fadeUp(0.05)}
          className="mx-auto mt-4 max-w-3xl text-[2.1rem] font-bold leading-[1.1] tracking-tight text-[var(--mkt-ink)] sm:text-[3rem]"
        >
          Let's talk about <span className="text-[var(--mkt-green)]">your school</span>
        </motion.h1>
        <motion.p
          {...fadeUp(0.1)}
          className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--mkt-muted)] sm:text-[17px]"
        >
          Questions about fees, receipts, pricing or getting started? Reach the Feezo team the way
          that suits you — we reply to every message.
        </motion.p>
        <motion.div
          {...fadeUp(0.15)}
          className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12.5px] font-medium text-[var(--mkt-ink)]/70"
        >
          <Pill icon={<Clock className="h-3.5 w-3.5" aria-hidden />}>{C.responseTime}</Pill>
          <Pill icon={<Phone className="h-3.5 w-3.5" aria-hidden />}>{C.hours}</Pill>
          <Pill icon={<ShieldCheck className="h-3.5 w-3.5" aria-hidden />}>
            Your details stay private
          </Pill>
        </motion.div>
      </section>

      <section
        className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10"
        aria-label="Contact channels"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CHANNELS.map((ch, i) => (
            <motion.div key={ch.id} {...fadeUp(0.05 * i)}>
              <ChannelCard channel={ch} />
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="message"
        className="relative mx-auto mt-14 grid max-w-6xl gap-6 px-5 sm:px-8 lg:mt-20 lg:grid-cols-12 lg:gap-8 lg:px-10"
      >
        <motion.div {...fadeUp()} className="lg:col-span-7">
          <ContactForm />
        </motion.div>

        <motion.aside {...fadeUp(0.08)} className="space-y-5 lg:col-span-5">
          <div className="overflow-hidden rounded-[24px] border border-[var(--mkt-line)] bg-white shadow-[0_18px_50px_-36px_rgba(26,28,44,0.45)]">
            <div className="relative aspect-[16/10] w-full bg-[var(--mkt-soft)]">
              <iframe
                title={`Map of ${C.location}`}
                src={MAP_EMBED}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full border-0 grayscale-[35%]"
              />
            </div>
            <div className="flex items-start gap-3 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mkt-soft)] text-[var(--mkt-green-deep)]">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[var(--mkt-ink)]">Feezo HQ</p>
                <p className="text-[13.5px] text-[var(--mkt-muted)]">
                  {C.location}, {C.country}
                </p>
                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--mkt-green-deep)] hover:underline"
                >
                  Get directions <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--mkt-line)] bg-white p-5 shadow-[0_18px_50px_-36px_rgba(26,28,44,0.45)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
              Working hours
            </p>
            <dl className="mt-3 space-y-2 text-[14px]">
              <HoursRow day="Monday – Saturday" time="9:30 AM – 6:30 PM" />
              <HoursRow day="Sunday & holidays" time="WhatsApp only" muted />
            </dl>
            <p className="mt-3 text-[12px] text-[var(--mkt-muted)]">All times in IST (UTC+5:30).</p>
          </div>

          <div className="rounded-[24px] bg-[var(--mkt-ink)] p-5 text-white shadow-[0_18px_50px_-30px_rgba(26,28,44,0.7)]">
            <p className="text-[15px] font-semibold">Ready to try it yourself?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/70">
              Set up your school in about a minute. Full access for 14 days, no card required.
            </p>
            <TrialSignupLink className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--mkt-green)] px-4 text-[13px] font-semibold text-white transition hover:bg-[var(--mkt-green-deep)]">
              Start free trial <ArrowRight className="h-4 w-4" aria-hidden />
            </TrialSignupLink>
          </div>
        </motion.aside>
      </section>

      <section className="relative mx-auto mt-16 max-w-3xl px-5 pb-20 sm:px-8 lg:mt-24">
        <motion.h2
          {...fadeUp()}
          className="text-center text-[1.6rem] font-bold tracking-tight text-[var(--mkt-ink)] sm:text-[2rem]"
        >
          Frequently asked
        </motion.h2>
        <motion.div {...fadeUp(0.05)}>
          <Accordion type="single" collapsible className="mt-6">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`} className="border-[var(--mkt-line)]">
                <AccordionTrigger className="text-left text-[15px] font-semibold text-[var(--mkt-ink)] hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-[var(--mkt-muted)]">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </section>
    </div>
  );
}

function Pill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mkt-line)] bg-white/80 px-3 py-1.5 shadow-sm">
      <span className="text-[var(--mkt-green-deep)]">{icon}</span>
      {children}
    </span>
  );
}

function HoursRow({ day, time, muted }: { day: string; time: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--mkt-ink)]/80">{day}</dt>
      <dd
        className={cn("font-semibold", muted ? "text-[var(--mkt-muted)]" : "text-[var(--mkt-ink)]")}
      >
        {time}
      </dd>
    </div>
  );
}

function ChannelCard({ channel }: { channel: Channel }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!channel.copy) return;
    try {
      await navigator.clipboard.writeText(channel.copy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn't copy — select the text instead.");
    }
  };

  return (
    <div className="group relative flex h-full flex-col rounded-[22px] border border-[var(--mkt-line)] bg-white p-5 shadow-[0_18px_50px_-38px_rgba(26,28,44,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--mkt-green)]/35 hover:shadow-[0_24px_60px_-34px_rgba(107,168,50,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl", channel.tone)}>
          {channel.icon}
        </span>
        {channel.copy ? (
          <button
            type="button"
            onClick={copy}
            aria-label={`Copy ${channel.label.toLowerCase()}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-[var(--mkt-muted)] opacity-70 transition hover:bg-[var(--mkt-soft)] hover:text-[var(--mkt-green-deep)] hover:opacity-100"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[var(--mkt-green)]" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--mkt-muted)]">
        {channel.label}
      </p>
      <p className="mt-1 break-words text-[17px] font-semibold text-[var(--mkt-ink)]">
        {channel.value}
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--mkt-muted)]">{channel.hint}</p>
      <a
        href={channel.href}
        target={channel.external ? "_blank" : undefined}
        rel={channel.external ? "noopener noreferrer" : undefined}
        className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13.5px] font-semibold text-[var(--mkt-green-deep)] transition-colors hover:text-[var(--mkt-green)]"
      >
        {channel.cta}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </a>
    </div>
  );
}

type FormState = {
  topic: ContactTopic;
  name: string;
  email: string;
  phone: string;
  school: string;
  message: string;
  website: string;
};
type FormErrors = Partial<Record<keyof FormState, string>>;

const inputClass =
  "h-12 w-full rounded-xl border bg-white px-4 text-[14.5px] text-[var(--mkt-ink)] outline-none transition-[border-color,box-shadow] placeholder:text-black/35 focus:border-[var(--mkt-green)] focus:ring-4 focus:ring-[var(--mkt-green)]/15";

function ContactForm() {
  const { session } = useAuth();
  const startedAt = useRef(Date.now());
  const [form, setForm] = useState<FormState>(() => ({
    topic: "demo",
    name: session?.displayName ?? "",
    email: session?.email ?? "",
    phone: "",
    school: session?.tenantName ?? "",
    message: "",
    website: "",
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState<{ reference: string } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    setServerError(null);
  };

  const topicLabel = CONTACT_TOPICS.find((t) => t.id === form.topic)?.label ?? "Enquiry";
  const whatsappDraft = () =>
    whatsappUrl(
      [
        `Hi Feezo team — ${topicLabel}.`,
        form.name && `Name: ${form.name}`,
        form.school && `School: ${form.school}`,
        form.message,
      ]
        .filter(Boolean)
        .join("\n"),
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = "Please tell us your name";
    if (!EMAIL_RE.test(form.email.trim())) e.email = "Enter a valid email";
    if (form.phone.trim() && !/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) {
      e.phone = "Enter a valid phone number";
    }
    setErrors(e);
    const first = (["name", "email", "phone"] as const).find((k) => e[k]);
    if (first) {
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const res = await apiSubmitContact({
        topic: form.topic,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        school: form.school.trim() || undefined,
        message: form.message.trim(),
        website: form.website,
        elapsedMs: Date.now() - startedAt.current,
        page: typeof window !== "undefined" ? window.location.pathname : undefined,
      });
      setDone({ reference: res.reference });
    } catch (err) {
      setServerError(
        err instanceof ApiError && err.status < 500
          ? err.message
          : "We couldn't send your message right now.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-[var(--mkt-line)] bg-white px-6 py-14 text-center shadow-[0_24px_60px_-40px_rgba(26,28,44,0.5)]">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--mkt-soft)]">
          <CheckCircle2 className="h-7 w-7 text-[var(--mkt-green)]" aria-hidden />
        </span>
        <h2 className="mt-4 text-[1.4rem] font-bold text-[var(--mkt-ink)]">Message sent</h2>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[var(--mkt-muted)]">
          Thanks {form.name.split(" ")[0]} — we've emailed a confirmation to{" "}
          <span className="font-semibold text-[var(--mkt-ink)]">{form.email}</span>.{" "}
          {C.responseTime}.
        </p>
        {done.reference ? (
          <p className="mt-4 rounded-full bg-[var(--mkt-soft)] px-3 py-1 text-[12.5px] font-semibold text-[var(--mkt-green-deep)]">
            Reference {done.reference}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            href={whatsappUrl(`Hi Feezo team, following up on ${done.reference || "my enquiry"}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--mkt-line)] px-4 text-[13px] font-semibold text-[var(--mkt-ink)] hover:border-[var(--mkt-green)]/40"
          >
            <WhatsAppIcon className="h-4 w-4" /> Need it sooner?
          </a>
          <Link
            to="/home"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--mkt-green)] px-4 text-[13px] font-semibold text-white hover:bg-[var(--mkt-green-deep)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      autoComplete="on"
      className="relative rounded-[28px] border border-[var(--mkt-line)] bg-white p-5 shadow-[0_24px_60px_-40px_rgba(26,28,44,0.5)] sm:p-8"
    >
      <h2 className="text-[1.35rem] font-bold tracking-tight text-[var(--mkt-ink)] sm:text-[1.6rem]">
        Send us a message
      </h2>
      <p className="mt-1 text-[14px] text-[var(--mkt-muted)]">
        Tell us a little about your school and we'll get back with the right person.
      </p>

      <fieldset className="mt-6">
        <legend className="mb-2 text-[12.5px] font-semibold text-[var(--mkt-ink)]/80">
          What can we help with?
        </legend>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {CONTACT_TOPICS.map((t) => {
            const on = form.topic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("topic", t.id)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                  on
                    ? "border-[var(--mkt-green)] bg-[var(--mkt-soft)] text-[var(--mkt-ink)]"
                    : "border-[var(--mkt-line)] bg-white text-[var(--mkt-ink)]/70 hover:border-[var(--mkt-green)]/40",
                )}
              >
                {on ? <Check className="h-3.5 w-3.5 text-[var(--mkt-green)]" aria-hidden /> : null}
                {t.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField id="contact-name" label="Your name" required error={errors.name}>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            className={cn(inputClass, errors.name ? "border-red-300" : "border-[var(--mkt-line)]")}
            placeholder="Full name"
            value={form.name}
            maxLength={120}
            onChange={(e) => set("name", e.target.value)}
          />
        </FormField>
        <FormField id="contact-email" label="Email" required error={errors.email}>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            className={cn(inputClass, errors.email ? "border-red-300" : "border-[var(--mkt-line)]")}
            placeholder="you@school.edu"
            value={form.email}
            maxLength={255}
            onChange={(e) => set("email", e.target.value)}
          />
        </FormField>
        <FormField id="contact-phone" label="Phone / WhatsApp" error={errors.phone}>
          <input
            id="contact-phone"
            name="tel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={cn(inputClass, errors.phone ? "border-red-300" : "border-[var(--mkt-line)]")}
            placeholder="+91 98765 43210"
            value={form.phone}
            maxLength={20}
            onChange={(e) => set("phone", e.target.value)}
          />
        </FormField>
        <FormField id="contact-school" label="School / organisation">
          <input
            id="contact-school"
            name="organization"
            autoComplete="organization"
            className={cn(inputClass, "border-[var(--mkt-line)]")}
            placeholder="School name"
            value={form.school}
            maxLength={200}
            onChange={(e) => set("school", e.target.value)}
          />
        </FormField>
      </div>

      <div className="mt-4">
        <FormField id="contact-message" label="Message" error={errors.message}>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            maxLength={4000}
            className={cn(
              inputClass,
              "h-auto min-h-[132px] resize-y py-3",
              errors.message ? "border-red-300" : "border-[var(--mkt-line)]",
            )}
            placeholder={
              form.topic === "demo"
                ? "Number of students, branches, and a good time for a call…"
                : "How can we help?"
            }
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
          />
        </FormField>
        <p className="mt-1 text-right text-[11px] text-[var(--mkt-muted)]">
          {form.message.length}/4000
        </p>
      </div>

      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      {serverError ? (
        <div
          role="alert"
          className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{serverError}</span>
          <a
            href={whatsappDraft()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-emerald-700 hover:underline"
          >
            <WhatsAppIcon className="h-4 w-4" /> Send on WhatsApp instead
          </a>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-[var(--mkt-muted)]">
          By sending, you agree to our{" "}
          <a href={BRAND.legal.privacyPath} className="underline hover:text-[var(--mkt-ink)]">
            Privacy Policy
          </a>
          . We never share your details.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--mkt-green)] px-6 text-[14.5px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(107,168,50,0.7)] transition-all hover:-translate-y-0.5 hover:bg-[var(--mkt-green-deep)] disabled:translate-y-0 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending…
            </>
          ) : (
            <>
              Send message <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function FormField({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[12.5px] font-semibold text-[var(--mkt-ink)]/80"
      >
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[12px] text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
