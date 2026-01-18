import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useDebounceCallback(callback, delay = 300) {
  const [timer, setTimer] = useState(null);

  const debouncedCallback = (...args) => {
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [timer]);

  return debouncedCallback;
}
