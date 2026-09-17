import { useCallback, useEffect, useMemo, useState } from "react";

import { getApiToken } from "@/lib/api/client";
import {
  apiGlListAccounts,
  apiGlReportTrialBalance,
  type GlAccount,
} from "@/lib/api/general-ledger";
import { useTenantStore } from "@/lib/tenant-store";

export type CashPositionLine = {
  accountId: string;
  name: string;
  kind: "cash" | "bank";
  balance: number;
};

export type CashPositionSnapshot = {
  cash: number;
  bank: number;
  total: number;
  lines: CashPositionLine[];
  /** GL ledgers when available; otherwise receipts − cleared payments by mode. */
  source: "gl" | "cashbook";
  ready: boolean;
};

function signedAssetBalance(debit: number, credit: number): number {
  return (Number(debit) || 0) - (Number(credit) || 0);
}

function buildGlSnapshot(
  accounts: GlAccount[],
  balances: Map<string, number>,
): CashPositionSnapshot {
  const lines: CashPositionLine[] = [];
  let cash = 0;
  let bank = 0;
  for (const a of accounts) {
    if (!a.isCash && !a.isBank) continue;
    const balance = balances.get(a.id) ?? 0;
    const kind = a.isCash ? "cash" : "bank";
    lines.push({ accountId: a.id, name: a.name, kind, balance });
    if (kind === "cash") cash += balance;
    else bank += balance;
  }
  lines.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "cash" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return {
    cash,
    bank,
    total: cash + bank,
    lines,
    source: "gl",
    ready: true,
  };
}

/**
 * Prefer general-ledger cash/bank balances (fund transfers included).
 * Falls back to payment-mode cash book when GL is unavailable.
 */
export function useCashPosition(
  fallbackCash: number,
  fallbackBank: number,
  expensesReady = true,
): CashPositionSnapshot {
  const { academicYear, activeBranchId: branchId } = useTenantStore();
  const [gl, setGl] = useState<CashPositionSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(getApiToken()));

  const load = useCallback(async () => {
    if (!getApiToken()) {
      setGl(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [accounts, tb] = await Promise.all([
        apiGlListAccounts(true),
        apiGlReportTrialBalance({ academicYear: academicYear || undefined }),
      ]);
      const cashBank = accounts.filter((a) => a.isCash || a.isBank);
      if (cashBank.length === 0) {
        setGl(null);
        return;
      }
      const bal = new Map<string, number>();
      for (const row of tb.rows) {
        bal.set(row.accountId, signedAssetBalance(row.debit, row.credit));
      }
      setGl(buildGlSnapshot(cashBank, bal));
    } catch {
      setGl(null);
    } finally {
      setLoading(false);
    }
  }, [academicYear, branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  return useMemo(() => {
    if (gl) return gl;
    return {
      cash: fallbackCash,
      bank: fallbackBank,
      total: fallbackCash + fallbackBank,
      lines: [
        { accountId: "cashbook-cash", name: "Cash In Hand", kind: "cash", balance: fallbackCash },
        { accountId: "cashbook-bank", name: "Bank Balance", kind: "bank", balance: fallbackBank },
      ],
      source: "cashbook",
      ready: expensesReady && !loading,
    };
  }, [gl, fallbackCash, fallbackBank, expensesReady, loading]);
}
