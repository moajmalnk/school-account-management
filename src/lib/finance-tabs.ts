export const FINANCE_TABS = [
  "receive",
  "make",
  "transfer",
  "transfers",
  "analytics",
  "ledger",
  "journals",
  "trial",
  "pl",
  "balance",
  "fees",
  "concession",
  "salary",
  "daybook",
  "reconciliation",
] as const;

export type FinanceTab = (typeof FINANCE_TABS)[number];

export function isFinanceTab(value: unknown): value is FinanceTab {
  return typeof value === "string" && (FINANCE_TABS as readonly string[]).includes(value);
}
