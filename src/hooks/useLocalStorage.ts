import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // Remove from local storage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// Specialized hooks for common use cases
export const useLocalStorageString = (
  key: string,
  initialValue: string = "",
) => {
  return useLocalStorage(key, initialValue);
};

export const useLocalStorageNumber = (
  key: string,
  initialValue: number = 0,
) => {
  return useLocalStorage(key, initialValue);
};

export const useLocalStorageBoolean = (
  key: string,
  initialValue: boolean = false,
) => {
  return useLocalStorage(key, initialValue);
};

export const useLocalStorageObject = <T extends Record<string, any>>(
  key: string,
  initialValue: T,
) => {
  return useLocalStorage(key, initialValue);
};

export const useLocalStorageArray = <T>(
  key: string,
  initialValue: T[] = [],
) => {
  return useLocalStorage(key, initialValue);
};

// Hook for managing multiple localStorage keys
export const useLocalStorageStore = <T extends Record<string, any>>(
  storeKey: string,
  initialStore: T,
): [
  T,
  (key: keyof T, value: T[keyof T]) => void,
  (key: keyof T) => void,
  () => void,
] => {
  const [store, setStore] = useLocalStorage(storeKey, initialStore);

  const updateStoreItem = useCallback(
    (key: keyof T, value: T[keyof T]) => {
      setStore((prevStore) => ({
        ...prevStore,
        [key]: value,
      }));
    },
    [setStore],
  );

  const removeStoreItem = useCallback(
    (key: keyof T) => {
      setStore((prevStore) => {
        const newStore = { ...prevStore };
        delete newStore[key];
        return newStore;
      });
    },
    [setStore],
  );

  const clearStore = useCallback(() => {
    setStore(initialStore);
  }, [setStore, initialStore]);

  return [store, updateStoreItem, removeStoreItem, clearStore];
};
