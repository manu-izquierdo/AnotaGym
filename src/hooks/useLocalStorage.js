import { useState, useEffect, useRef } from 'react';

function useLocalStorage(key, initialValue) {
  const initialRef = useRef(initialValue);
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialRef.current;
    } catch (error) {
      console.warn('Error reading localStorage', error);
      return initialRef.current;
    }
  });

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialRef.current);
    } catch (error) {
      console.warn('Error switching localStorage key', error);
      setStoredValue(initialRef.current);
    }
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn('Error setting localStorage', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
