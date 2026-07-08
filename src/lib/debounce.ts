export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  cancel: () => void;
}

// Trailing-edge debounce: the wrapped fn runs `delay` ms after the last call.
// `cancel()` drops any pending call (used to pre-empt a debounced regenerate
// with an immediate one, and to clean up on unmount).
export function debounce<A extends unknown[]>(fn: (...args: A) => void, delay: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: A) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}
