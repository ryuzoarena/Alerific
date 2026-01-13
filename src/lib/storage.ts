// IndexedDB storage for audio files and localStorage for metadata
const DB_NAME = 'sybau-music-db';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio-files';
const COVER_STORE = 'cover-images';

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(AUDIO_STORE)) {
        database.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(COVER_STORE)) {
        database.createObjectStore(COVER_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveAudioFile = async (id: string, blob: Blob): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.put({ id, blob });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getAudioFile = async (id: string): Promise<Blob | null> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readonly');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result?.blob || null);
    };
  });
};

export const deleteAudioFile = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([AUDIO_STORE], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const saveCoverImage = async (id: string, blob: Blob): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([COVER_STORE], 'readwrite');
    const store = transaction.objectStore(COVER_STORE);
    const request = store.put({ id, blob });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getCoverImage = async (id: string): Promise<Blob | null> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([COVER_STORE], 'readonly');
    const store = transaction.objectStore(COVER_STORE);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result?.blob || null);
    };
  });
};

export const deleteCoverImage = async (id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([COVER_STORE], 'readwrite');
    const store = transaction.objectStore(COVER_STORE);
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};
