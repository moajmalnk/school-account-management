/** Product identity — used in chrome, PWA, and auth. */
export const BRAND = {
  name: "Feezo",
  tagline: "Edu Books",
  mark: "/icons/feezo-mark.png",
  /** Google Play listing — used by marketing store badges. */
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.bzole.feezo",
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
