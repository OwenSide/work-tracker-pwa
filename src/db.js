import { useState, useEffect } from 'react';

const DB_NAME = 'WorkTrackerDB';
const STORE_NAME = 'stateStore';

// Инициализация базы данных
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export function useIndexedDB(key, initialValue) {
  const [state, setState] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    initDB().then((db) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => {
        if (request.result !== undefined) {
          setState(request.result);
        }
        setIsLoaded(true); // Отмечаем, что данные загружены
      };
      request.onerror = () => {
        console.error('Ошибка чтения из IndexedDB');
        setIsLoaded(true);
      };
    });
  }, [key]);

  const setValue = async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore); // Обновляем стейт в React мгновенно
      
      // Асинхронно сохраняем в базу
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(valueToStore, key);
    } catch (error) {
      console.error('Ошибка записи в IndexedDB', error);
    }
  };

  return [state, setValue, isLoaded];
}