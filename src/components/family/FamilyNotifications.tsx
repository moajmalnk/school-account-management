import { useEffect, useState } from "react";

import { FamilyCard, FamilyHeader } from "@/components/family/FamilyChrome";
import { familyMarkNotifications, familyNotifications } from "@/lib/api/family";

export function FamilyNotifications() {
  const [items, setItems] = useState<
    { id: string; title: string; body: string; href: string | null; read: boolean }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    familyNotifications().then((data) => {
      if (!cancelled) setItems(data.items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <FamilyHeader showBell={false} />
      <div className="space-y-3 px-4 pb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-extrabold tracking-tight text-[var(--family-ink)]">Notifications</h1>
          <button
            type="button"
            className="text-sm font-bold text-[var(--family-lavender-deep)]"
            onClick={() => {
              void familyMarkNotifications().then(() => {
                setItems((current) => current.map((item) => ({ ...item, read: true })));
              });
            }}
          >
            Mark read
          </button>
        </div>
        {items.length === 0 ? (
          <FamilyCard>
            <p className="text-sm text-[var(--family-ink-muted)]">No notifications yet.</p>
          </FamilyCard>
        ) : (
          items.map((item) => (
            <FamilyCard key={item.id} className={item.read ? "opacity-70" : ""}>
              <p className="text-sm font-bold">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--family-ink-muted)]">{item.body}</p>
              {item.href ? (
                <a href={item.href} className="mt-2 inline-block text-sm font-bold text-[var(--family-lavender-deep)]">
                  Open
                </a>
              ) : null}
            </FamilyCard>
          ))
        )}
      </div>
    </>
  );
}
