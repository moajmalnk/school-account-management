import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/ui/info-tip";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { BASE_LANGUAGE_TIP } from "@/lib/help/settings-tips";
import {
  LANGUAGES,
  languageOption,
  languagePickerLabel,
  setOrgLanguage,
  useOrgLanguage,
  type LanguageCode,
} from "@/lib/locale/languages";
import { setMoneyLanguage } from "@/lib/money";

/** Settings → School: organization base language (English live; more locales coming). */
export function OrgLanguageCard() {
  const { session } = useAuth();
  const language = useOrgLanguage();
  const [draft, setDraft] = useState<LanguageCode>(language);
  const [saving, setSaving] = useState(false);
  const canEdit = session?.role === "school_admin";
  const dirty = draft !== language;

  useEffect(() => {
    setDraft(language);
  }, [language]);

  const save = () => {
    const opt = languageOption(draft);
    if (!opt.available) {
      toast.message(`${opt.label} is coming soon`, {
        description: "The workspace stays in English until that language ships.",
      });
      setDraft(language);
      return;
    }
    setSaving(true);
    try {
      const saved = setOrgLanguage(draft);
      setMoneyLanguage(saved);
      const label = languageOption(saved).label;
      toast.success(`Base language set to ${label}`, {
        description: "Menus and documents will use this language as more locales ship.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="col-span-12 sm:col-span-6 lg:col-span-6">
      <Label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-black/55 dark:text-zinc-400">
        Base language
        <InfoTip content={BASE_LANGUAGE_TIP} className="-my-1" />
      </Label>
      <div className="mt-1.5 flex items-center gap-2">
        <Select
          value={draft}
          onValueChange={(v) => setDraft(v as LanguageCode)}
          disabled={!canEdit || saving}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.code} value={l.code} disabled={!l.available}>
                {languagePickerLabel(l)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && dirty ? (
          <Button type="button" size="sm" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        ) : null}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-black/45 dark:text-zinc-400">
        English now · Arabic, Hindi and Malayalam coming soon.
        {!canEdit ? " Admin only." : ""}
      </p>
    </div>
  );
}
