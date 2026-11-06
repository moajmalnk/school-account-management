/** Reload a split chunk a few times before surfacing a route crash. */
export function importWithRetry<T>(factory: () => Promise<T>, attempts = 3): Promise<T> {
  return factory().catch((error: unknown) => {
    if (attempts <= 1) throw error;
    return new Promise((resolve) => {
      window.setTimeout(resolve, 400);
    }).then(() => importWithRetry(factory, attempts - 1));
  });
}
