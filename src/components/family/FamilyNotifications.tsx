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
      <div className="space-y-3 px-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Notifications</h1>
          <button
            type="button"
            className="text-sm font-medium text-[#0F766E]"
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
            <p className="text-sm text-slate-500">No notifications yet.</p>
          </FamilyCard>
        ) : (
          items.map((item) => (
            <FamilyCard key={item.id} className={item.read ? "opacity-70" : ""}>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">{item.body}</p>
              {item.href ? (
                <a href={item.href} className="mt-2 inline-block text-sm font-medium text-[#0F766E]">
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
