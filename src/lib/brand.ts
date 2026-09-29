/** Product identity — used in chrome, PWA, and auth. */
export const BRAND = {
  name: "Feezo",
  tagline: "Edu Books",
  mark: "/icons/feezo-mark.png",
  /** Google Play listing — used by marketing store badges. */
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.bzole.feezo",
  appStoreUrl: "https://apps.apple.com/in/app/feezo/id6811416005",
  contactPath: "/contact",
  contact: {
    email: "info@feezo.app",
    phoneDisplay: "+91 77364 83502",
    phoneE164: "+917736483502",
    whatsappDisplay: "+91 77364 83502",
    /** wa.me expects digits only, no + */
    whatsappNumber: "917736483502",
    location: "Malappuram, Kerala",
    country: "India",
    hours: "Mon – Sat · 9:30 AM – 6:30 PM IST",
    responseTime: "Replies within 1 business day",
    mapQuery: "Malappuram, Kerala, India",
  },
  legal: {
    termsPath: "/terms",
    privacyPath: "/privacy",
    refundPolicyPath: "/refund-policy",
    dataDeletionPath: "/data-deletion",
    termsUrl: "https://www.feezo.app/terms",
    privacyUrl: "https://www.feezo.app/privacy",
    refundPolicyUrl: "https://www.feezo.app/refund-policy",
    dataDeletionUrl: "https://www.feezo.app/data-deletion",
    supportEmail: "support@feezo.app",
  },
} as const;
