import type { FeezoLocale, FeezoNavigation } from "@/lib/api/ai";

export type FeezoFollowUp = {
  /** Short chip text shown under the reply (question-style). */
  label: string;
  /** Full prompt sent when the chip is tapped. */
  prompt: string;
};

type BuildOpts = {
  locale: FeezoLocale;
  userText: string;
  assistantText: string;
  navigations?: FeezoNavigation[];
};

function hay(...parts: string[]) {
  return parts.join("\n").toLowerCase();
}

function includesAny(text: string, needles: string[]) {
  return needles.some((n) => text.includes(n));
}

/**
 * Contextual question chips after an assistant reply.
 * Prefer “how / what / where” questions — not “Open …” (those are already CTAs).
 */
export function buildFeezoFollowUps(opts: BuildOpts): FeezoFollowUp[] {
  const { locale, userText, assistantText, navigations } = opts;
  const text = hay(userText, assistantText);
  const ml = locale === "ml";

  const taken = new Set(
    (navigations ?? [])
      .map((n) => (n.label || n.to || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const push = (out: FeezoFollowUp[], item: FeezoFollowUp) => {
    const key = item.label.trim().toLowerCase();
    if (!key || taken.has(key)) return;
    if (out.some((x) => x.label.toLowerCase() === key || x.prompt === item.prompt)) return;
    taken.add(key);
    out.push(item);
  };

  const out: FeezoFollowUp[] = [];

  const isSetup = includesAny(text, [
    "set up",
    "setup",
    "step by step",
    "school details",
    "branch",
    "class tier",
    "fee categor",
    "tuition",
    "സെറ്റപ്പ്",
    "ബ്രാഞ്ച്",
    "ക്ലാസ് ടയർ",
    "ഫീസ് കാറ്റഗറി",
  ]);

  const isFees = includesAny(text, [
    "fee",
    "overdue",
    "receipt",
    "payment",
    "collect",
    "receive",
    "ഫീസ്",
    "കുടിശ്ശിക",
    "രസീത്",
  ]);

  const isStudent = includesAny(text, [
    "student",
    "admission",
    "profile",
    "guardian",
    "വിദ്യാർത്ഥി",
    "അഡ്മിഷൻ",
  ]);

  const isStaff = includesAny(text, ["staff", "salary", "payroll", "attendance", "സ്റ്റാഫ്", "ശമ്പള"]);

  const isFinance = includesAny(text, [
    "financial",
    "ledger",
    "balance",
    "trial",
    "day book",
    "journal",
    "സാമ്പത്തിക",
    "ലെഡ്ജർ",
  ]);

  const isSearch = includesAny(text, [
    "search",
    "find",
    "phone",
    "email",
    "⌘k",
    "ctrl+k",
    "global search",
    "തിരയുക",
  ]);

  const isSupport = includesAny(text, ["support", "help", "guide", "സപ്പോർട്ട്", "സഹായ"]);

  if (isSetup) {
    push(out, {
      label: ml ? "പുതിയ ക്യാമ്പസ് എങ്ങനെ ചേർക്കാം?" : "How do I add another campus?",
      prompt: ml
        ? "പുതിയ ബ്രാഞ്ച് / ക്യാമ്പസ് എങ്ങനെ ചേർക്കാം? ഘട്ടം ഘട്ടമായി പറയൂ"
        : "How do I add another campus or branch? Walk me through it step by step.",
    });
    push(out, {
      label: ml ? "ക്ലാസും ഡിവിഷനും എങ്ങനെ?" : "How do I add classes & divisions?",
      prompt: ml
        ? "Class Tier-ൽ ക്ലാസും ഡിവിഷനും എങ്ങനെ ചേർക്കാം?"
        : "How do I add classes and divisions in Class Tier?",
    });
    push(out, {
      label: ml ? "ട്യൂഷൻ ഫീസ് എങ്ങനെ സെറ്റ് ചെയ്യാം?" : "How do I set tuition fees?",
      prompt: ml
        ? "Fee Category-യിൽ ട്യൂഷൻ ഫീസ് എങ്ങനെ സെറ്റപ്പ് ചെയ്യാം?"
        : "How do I set up tuition fees in Fee Category?",
    });
    push(out, {
      label: ml ? "സ്റ്റാഫ് ലോഗിൻ എങ്ങനെ നൽകാം?" : "How do I give staff login access?",
      prompt: ml
        ? "Users-ൽ സ്റ്റാഫിന് ലോഗിൻ ആക്‌സസ് എങ്ങനെ നൽകാം?"
        : "How do I give staff login access under Settings → Users?",
    });
  } else if (isFees) {
    push(out, {
      label: ml ? "ഫീസ് എങ്ങനെ റെക്കോർഡ് ചെയ്യാം?" : "How do I record a fee payment?",
      prompt: ml
        ? "ഒരു വിദ്യാർത്ഥിക്ക് ഫീസ് റെക്കോർഡ് ചെയ്യുന്നത് എങ്ങനെ? ഘട്ടം ഘട്ടമായി പറയൂ"
        : "How do I record a fee payment for a student? Explain step by step.",
    });
    push(out, {
      label: ml ? "കുടിശ്ശിക ആരൊക്കെയുണ്ട്?" : "Who has overdue fees?",
      prompt: ml ? "കുടിശ്ശികയുള്ള വിദ്യാർത്ഥികൾ ആരൊക്കെയുണ്ട്?" : "Who has overdue fees right now?",
    });
    push(out, {
      label: ml ? "WhatsApp റിമൈൻഡർ എവിടെ?" : "Where do I edit WhatsApp reminders?",
      prompt: ml
        ? "WhatsApp ഫീസ് റിമൈൻഡർ ടെംപ്ലേറ്റ് എവിടെ എഡിറ്റ് ചെയ്യാം?"
        : "Where do I edit WhatsApp fee reminder message templates?",
    });
    push(out, {
      label: ml ? "ഫീസ് റിപ്പോർട്ട് എങ്ങനെ കാണാം?" : "How do I open the fees report?",
      prompt: ml
        ? "ഫീസ് റിപ്പോർട്ട് എങ്ങനെ തുറക്കാം, എന്തൊക്കെ കാണാം?"
        : "How do I open the fees report and what does it show?",
    });
  } else if (isStudent) {
    push(out, {
      label: ml ? "ഫോൺ / ID കൊണ്ട് കണ്ടെത്താമോ?" : "Can I find a student by phone or ID?",
      prompt: ml
        ? "ഫോൺ അല്ലെങ്കിൽ അഡ്മിഷൻ നമ്പർ ഉപയോഗിച്ച് വിദ്യാർത്ഥിയെ എങ്ങനെ കണ്ടെത്താം?"
        : "How do I find a student by phone number or admission ID?",
    });
    push(out, {
      label: ml ? "പുതിയ അഡ്മിഷൻ എങ്ങനെ?" : "How do I admit a new student?",
      prompt: ml
        ? "പുതിയ വിദ്യാർത്ഥിയെ അഡ്മിറ്റ് ചെയ്യുന്നത് എങ്ങനെ?"
        : "How do I admit a new student step by step?",
    });
    push(out, {
      label: ml ? "പ്രൊഫൈലിൽ ഫീസ് എങ്ങനെ?" : "How do I collect fees from a profile?",
      prompt: ml
        ? "വിദ്യാർത്ഥി പ്രൊഫൈലിൽ നിന്ന് ഫീസ് സ്വീകരിക്കുന്നത് എങ്ങനെ?"
        : "How do I collect fees from a student profile?",
    });
    push(out, {
      label: ml ? "ഡീആക്ടിവേറ്റ് vs ഡിലീറ്റ്?" : "Deactivate vs delete a student?",
      prompt: ml
        ? "വിദ്യാർത്ഥിയെ ഡീആക്ടിവേറ്റ് ചെയ്യുന്നതും ഡിലീറ്റ് ചെയ്യുന്നതും തമ്മിലുള്ള വ്യത്യാസം എന്ത്?"
        : "When should I deactivate a student instead of deleting them?",
    });
  } else if (isStaff) {
    push(out, {
      label: ml ? "സ്റ്റാഫ് എങ്ങനെ ചേർക്കാം?" : "How do I add a staff member?",
      prompt: ml ? "പുതിയ സ്റ്റാഫ് അംഗത്തെ എങ്ങനെ ചേർക്കാം?" : "How do I add a new staff member?",
    });
    push(out, {
      label: ml ? "ശമ്പളം എങ്ങനെ കാണാം?" : "How do I view salary / payroll?",
      prompt: ml
        ? "ശമ്പള റിപ്പോർട്ട് / പേറോൾ എങ്ങനെ കാണാം?"
        : "How do I view salary or payroll reports?",
    });
    push(out, {
      label: ml ? "ലീവ് സെറ്റിംഗ്സ് എവിടെ?" : "Where are leave settings?",
      prompt: ml
        ? "ലീവ് തരങ്ങളും സെറ്റിംഗ്സും എവിടെ ക്രമീകരിക്കാം?"
        : "Where do I configure leave types and settings?",
    });
  } else if (isFinance) {
    push(out, {
      label: ml ? "ഡേ ബുക്ക് എന്തിന്?" : "What is the day book for?",
      prompt: ml
        ? "Day book എന്തിനാണ്, എങ്ങനെ ഉപയോഗിക്കാം?"
        : "What is the day book for and how do I use it?",
    });
    push(out, {
      label: ml ? "ട്രയൽ ബാലൻസ് എങ്ങനെ?" : "How do I check trial balance?",
      prompt: ml
        ? "Trial balance എങ്ങനെ തുറക്കാം, എന്ത് നോക്കണം?"
        : "How do I open trial balance and what should I check?",
    });
    push(out, {
      label: ml ? "കുടിശ്ശിക എങ്ങനെ കാണാം?" : "How do I see overdue balances?",
      prompt: ml
        ? "കുടിശ്ശികയുള്ള വിദ്യാർത്ഥികളെ എങ്ങനെ കാണാം?"
        : "How do I see students with overdue balances?",
    });
  } else if (isSearch) {
    push(out, {
      label: ml ? "Global Search എങ്ങനെ?" : "How does Global Search work?",
      prompt: ml
        ? "ഹെഡറിലെ Global Search (⌘K) എങ്ങനെ ഉപയോഗിക്കാം?"
        : "How do I use Global Search (⌘K) in the header?",
    });
    push(out, {
      label: ml ? "മൊബൈലിൽ സെർച്ച് എവിടെ?" : "Where is search on mobile?",
      prompt: ml
        ? "മൊബൈൽ ആപ്പിൽ workspace search എവിടെയാണ്?"
        : "Where do I find workspace search on mobile?",
    });
    push(out, {
      label: ml ? "വിദ്യാർത്ഥിയെ എങ്ങനെ തിരയാം?" : "How do I search for a student?",
      prompt: ml
        ? "പേര് അല്ലെങ്കിൽ ഫോൺ ഉപയോഗിച്ച് വിദ്യാർത്ഥിയെ എങ്ങനെ കണ്ടെത്താം?"
        : "How do I find a student by name or phone?",
    });
  } else if (isSupport) {
    push(out, {
      label: ml ? "ലൈവ് ചാറ്റ് എങ്ങനെ തുറക്കാം?" : "How do I open live support chat?",
      prompt: ml
        ? "Feezo സപ്പോർട്ട് ലൈവ് ചാറ്റ് എങ്ങനെ തുറക്കാം?"
        : "How do I open Feezo support live chat?",
    });
    push(out, {
      label: ml ? "ഹെൽപ്പ് ഗൈഡുകൾ എവിടെ?" : "Where are the help guides?",
      prompt: ml
        ? "Help & support ഗൈഡുകൾ എവിടെ കാണാം?"
        : "Where can I browse Help & support guides?",
    });
  }

  // Defaults when topic is unclear — always leave useful questions.
  if (out.length < 2) {
    push(out, {
      label: ml ? "ഇപ്പോഴത്തെ സാമ്പത്തിക സ്ഥിതി?" : "What is our financial status?",
      prompt: ml
        ? "ഇപ്പോഴത്തെ സാമ്പത്തിക സ്ഥിതി ചുരുക്കി പറയൂ"
        : "What is our current financial status? Summarize briefly.",
    });
    push(out, {
      label: ml ? "കുടിശ്ശിക ആരൊക്കെയുണ്ട്?" : "Who has overdue fees?",
      prompt: ml ? "കുടിശ്ശികയുള്ള വിദ്യാർത്ഥികൾ ആരൊക്കെയുണ്ട്?" : "Who has overdue fees right now?",
    });
    push(out, {
      label: ml ? "സ്കൂൾ സെറ്റപ്പ് അടുത്ത ഘട്ടം?" : "What’s next for school setup?",
      prompt: ml
        ? "സ്കൂൾ സെറ്റപ്പ് പൂർത്തിയാക്കാൻ അടുത്ത ഘട്ടം എന്താണ്?"
        : "What is the next step to finish school setup?",
    });
    push(out, {
      label: ml ? "Global Search എങ്ങനെ?" : "How does Global Search work?",
      prompt: ml
        ? "Global Search (⌘K) ഉപയോഗിച്ച് പേജുകളും വിദ്യാർത്ഥികളും കണ്ടെത്തുന്നത് എങ്ങനെ?"
        : "How do I find pages and students with Global Search (⌘K)?",
    });
  }

  return out.slice(0, 4);
}
