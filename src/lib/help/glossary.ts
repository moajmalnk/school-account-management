export type GlossaryTerm = {
  term: string;
  meaning: string;
  example?: string;
};

export const HELP_GLOSSARY: GlossaryTerm[] = [
  {
    term: "Academic year",
    meaning:
      "The school year your books are kept in. Every receipt, payment and enrollment belongs to one year.",
    example: "AY 2026-27 covers June 2026 to March 2027 if you set it that way.",
  },
  {
    term: "Receipt",
    meaning: "Money coming in. Created when you use Receive payment.",
    example: "A parent pays this month's tuition → one receipt.",
  },
  {
    term: "Payment voucher",
    meaning: "Money going out. Created when you use Make payment for salaries or expenses.",
  },
  {
    term: "Contra (transfer)",
    meaning:
      "Money moving between your own cash and bank accounts. It is not income or expense, so profit does not change.",
    example: "Depositing today's cash collection into the bank.",
  },
  {
    term: "Ledger",
    meaning: "The full history of one account with a running balance, like a bank passbook.",
  },
  {
    term: "Journal",
    meaning:
      "The accounting entry behind every transaction. Feezo writes them for you. You only add manual ones for corrections or opening balances.",
  },
  {
    term: "Debit and credit",
    meaning:
      "The two sides of every journal. They must always be equal. Money into cash or bank is a debit; income earned is a credit.",
  },
  {
    term: "Opening balance",
    meaning:
      "What each account held on the day you started using Feezo, such as cash in hand and bank balance.",
  },
  {
    term: "Trial balance",
    meaning:
      "A list of every account's balance. Total debits equal total credits when the books are right.",
  },
  {
    term: "Profit & Loss",
    meaning: "Income minus expenses for the year. A positive result is a surplus.",
  },
  {
    term: "Balance sheet",
    meaning: "What the school owns (cash, bank, fees due) and owes on a given date.",
  },
  {
    term: "Retained earnings",
    meaning:
      "Past years' surplus or deficit. When you close a year, its profit or loss moves here.",
  },
  {
    term: "Suspense",
    meaning:
      "A temporary holding account for amounts Feezo could not match to a proper head. It should normally be zero.",
  },
  {
    term: "Concession",
    meaning: "A discount or waiver that reduces what a student owes.",
    example: "A 10% sibling discount on tuition.",
  },
  {
    term: "Fee period",
    meaning: "The month or term a fee is for. Chosen when collecting a fee.",
  },
  {
    term: "Hold (salary)",
    meaning:
      "A salary recorded as owed but not yet paid. It stays in Salary Outstanding until you pay it.",
  },
  {
    term: "Campus (branch)",
    meaning: "A separate school location with its own students and books under the same account.",
  },
];
