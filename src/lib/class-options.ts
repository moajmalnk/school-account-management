import type { ClassConfig } from "@/lib/tenant-store";

export function classSelectOptions(classes: ClassConfig[], currentClass: string) {
  const options = classes.map((c) => ({ value: c.className, label: c.className }));
  if (
    currentClass.trim() &&
    !options.some((o) => o.value.toLowerCase() === currentClass.trim().toLowerCase())
  ) {
    options.push({ value: currentClass, label: currentClass });
  }
  return options;
}
