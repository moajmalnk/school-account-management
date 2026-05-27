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
};

export const seedTenants: Tenant[] = [
  { id: "T-1042", uuid: "8f3a-91bd-4f02-aac1", name: "Silver Hills Global Group", subdomain: "silverhills", tier: "Enterprise", status: "Active", students: 4280, capacity: 5000, createdAt: "2025-02-14" },
  { id: "T-1043", uuid: "2c11-7e88-44ac-b9d2", name: "Apex Technical Academy", subdomain: "apex-tech", tier: "Premium", status: "Active", students: 1820, capacity: 2500, createdAt: "2025-03-02" },
  { id: "T-1044", uuid: "9d77-bb19-4f3e-a7c2", name: "St. Jude Educational Foundations", subdomain: "stjude-edu", tier: "Enterprise", status: "Trial", students: 320, capacity: 5000, createdAt: "2025-09-18" },
  { id: "T-1045", uuid: "4a02-cd45-4001-9e1f", name: "Emerald Valley Public School", subdomain: "emerald-academy", tier: "Basic", status: "Overdue", students: 540, capacity: 800, createdAt: "2024-11-09" },
  { id: "T-1046", uuid: "1b76-fe33-49ab-83c0", name: "Crescent Bay International", subdomain: "crescentbay", tier: "Premium", status: "Active", students: 2100, capacity: 2500, createdAt: "2025-01-22" },
  { id: "T-1047", uuid: "6e90-aa14-4f8e-bc33", name: "Northwood Grammar Trust", subdomain: "northwood", tier: "Basic", status: "Suspended", students: 220, capacity: 800, createdAt: "2024-08-04" },
  { id: "T-1048", uuid: "3f55-d211-4a77-9080", name: "Heritage Montessori Network", subdomain: "heritage-mn", tier: "Premium", status: "Trial", students: 90, capacity: 2500, createdAt: "2025-10-11" },
  { id: "T-1049", uuid: "7c08-ee62-4dd2-b6a4", name: "Orchid Springs Academy", subdomain: "orchidsprings", tier: "Enterprise", status: "Active", students: 3650, capacity: 5000, createdAt: "2025-04-30" },
  { id: "T-1050", uuid: "5d2b-9f70-4c19-a3d8", name: "Lakeside Public Schools", subdomain: "lakeside-ps", tier: "Basic", status: "Active", students: 610, capacity: 800, createdAt: "2025-07-19" },
  { id: "T-1051", uuid: "0a91-7c5d-4488-be2e", name: "Vivekananda Vidya Mandir", subdomain: "vivekananda", tier: "Premium", status: "Overdue", students: 1990, capacity: 2500, createdAt: "2024-10-21" },
];

export const recentRegistrations = [
  { name: "St. Jude Educational Foundations", domain: "stjude-edu.schoolaccounts.in", step: "Domain verified", flag: "DNS-OK", time: "2h ago" },
  { name: "Heritage Montessori Network", domain: "heritage-mn.schoolaccounts.in", step: "Awaiting payment", flag: "BILLING-PEND", time: "5h ago" },
  { name: "Crescent Bay International", domain: "crescentbay.schoolaccounts.in", step: "Provisioned", flag: "READY", time: "1d ago" },
  { name: "Lakeside Public Schools", domain: "lakeside-ps.schoolaccounts.in", step: "Configuring SIS", flag: "WIP", time: "2d ago" },
  { name: "Orchid Springs Academy", domain: "orchidsprings.schoolaccounts.in", step: "Provisioned", flag: "READY", time: "3d ago" },
];

export const impersonationLogs = [
  { admin: "Rohan Mehta", tenant: "Silver Hills Global Group", ticket: "SUP-4421", time: "2025-05-26 14:32", duration: "12m 04s" },
  { admin: "Priya Subramanian", tenant: "Apex Technical Academy", ticket: "SUP-4419", time: "2025-05-26 11:08", duration: "06m 42s" },
  { admin: "Devanand Iyer", tenant: "Emerald Valley Public School", ticket: "BILL-2208", time: "2025-05-25 19:55", duration: "23m 18s" },
  { admin: "Rohan Mehta", tenant: "Vivekananda Vidya Mandir", ticket: "BILL-2210", time: "2025-05-25 09:21", duration: "08m 51s" },
  { admin: "Anika Roy", tenant: "Northwood Grammar Trust", ticket: "SEC-1101", time: "2025-05-24 22:14", duration: "31m 02s" },
];

export const webhookEvents = [
  { source: "Razorpay", event: "payment.captured", status: 200, time: "14:42:11", payload: "₹ 24,500 / Silver Hills Global Group" },
  { source: "Stripe", event: "invoice.paid", status: 200, time: "14:38:02", payload: "USD 299 / Apex Technical Academy" },
  { source: "Razorpay", event: "subscription.activated", status: 200, time: "14:31:47", payload: "Heritage Montessori Network" },
  { source: "Razorpay", event: "payment.failed", status: 402, time: "14:22:09", payload: "₹ 8,200 / Emerald Valley Public School" },
  { source: "Internal", event: "tenant.provisioned", status: 201, time: "14:11:55", payload: "stjude-edu.schoolaccounts.in" },
  { source: "Stripe", event: "customer.subscription.updated", status: 200, time: "13:58:18", payload: "Orchid Springs Academy → Enterprise" },
];
