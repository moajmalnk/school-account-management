/** Remove the HTML LCP boot shell if it is still covering the app. */
export function dismissBootShell() {
  if (typeof window === "undefined") return;
  const dismiss = (window as Window & { __feezoDismissBootShell?: () => void })
    .__feezoDismissBootShell;
  if (dismiss) {
    dismiss();
    return;
  }
  const shell = document.getElementById("boot-shell");
  if (!shell) return;
  shell.remove();
}
