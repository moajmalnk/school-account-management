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
  createdAt: string;
  /** Primary school admin login email (username). */
  adminEmail?: string;
};
