import { useState, useEffect } from 'react';
import { openDB } from 'idb';

const DB_NAME = 'WorkTrackerDB';
const STORE_NAME = 'stateStore';

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export function useIndexedDB(key, initialValue) {
  const [state, setState] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const db = await initDB();
        const val = await db.get(STORE_NAME, key);
        if (val !== undefined) setState(val);
      } catch (e) {
        console.error('IDB Load Error:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, [key]);

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      const db = await initDB();
      await db.put(STORE_NAME, valueToStore, key);
    } catch (error) {
      console.error('IDB Save Error:', error);
    }
  };

  return [state, setValue, isLoaded];
}