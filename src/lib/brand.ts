/** Product identity — used in chrome, PWA, and auth. */
export const BRAND = {
  name: "Feezo",
  tagline: "Edu Books",
  mark: "/icons/feezo-mark.png",
  /** Public URLs for App Store / Play Console store listing. */
  legal: {
    privacyPath: "/privacy",
    dataDeletionPath: "/data-deletion",
    privacyUrl: "https://www.feezo.app/privacy",
    dataDeletionUrl: "https://www.feezo.app/data-deletion",
    supportEmail: "support@feezo.app",
  },
} as const;
