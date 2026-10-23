export type Tier = "Basic" | "Premium" | "Enterprise";
export type Status = "Active" | "Trial" | "Overdue" | "Suspended";

export type Tenant = {
  id: string;
  uuid: string;
  name: string;
  subdomain: string;
  tier: Tier;
  status: Status;
  students: number;
  capacity: number;
  /** Active staff count (from registry list). */
  staffCount?: number;
  /** Branch count (from registry list). */
  branchCount?: number;
  /** Plan list price INR / month. */
  monthlyPriceInr?: number;
  /** MRR counted when Active or Trial. */
  mrrContribution?: number;
  /** Seat fill % (students / capacity). */
  seatUtilizationPct?: number;
  createdAt: string;
  /** Primary school admin login email (username). */
  adminEmail?: string;
  /** Set while a Super Admin has deactivated the workspace (status Suspended). */
  accessDisabledAt?: string | null;
  accessDisabledReason?: string | null;
  /** Lifecycle status to restore on reactivation. */
  statusBeforeDisable?: Status | null;
  /** When false, school PDFs omit the Feezo footer credit. Omitted means on. */
  pdfCreditEnabled?: boolean;
};
