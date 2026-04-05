const CACHE_TTL_MS = 30000;
const cacheStore = new Map();

export const getAdminCache = (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return null;
  }

  return item.value;
};

export const setAdminCache = (key, value) => {
  cacheStore.set(key, { value, timestamp: Date.now() });
};

export const clearAdminCacheByPrefix = (prefix) => {
  const keys = Array.from(cacheStore.keys());
  keys.forEach((key) => {
    if (key.startsWith(prefix)) cacheStore.delete(key);
  });
};
