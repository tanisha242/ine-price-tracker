/**
 * Utility to run an async operation with retry logic
 */
export async function withRetry(fn, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const delayMs = options.delayMs ?? 1000;
  const backoffFactor = options.backoffFactor ?? 1.5;
  const onRetry = options.onRetry || (() => {});

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      onRetry(err, attempt);
      if (attempt < maxRetries) {
        const wait = delayMs * Math.pow(backoffFactor, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, wait));
      }
    }
  }
  throw lastError;
}
