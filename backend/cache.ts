type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const MAX_CACHE_ITEMS = 500;

export function getFromCache<T>(key: string): T | null {
  const cachedItem = cache.get(key);

  if (!cachedItem) {
    return null;
  }

  if (Date.now() > cachedItem.expiresAt) {
    cache.delete(key);
    return null;
  }

  return cachedItem.data as T;
}

export function setCache<T>(
  key: string,
  data: T,
  ttlMs: number
) {
    if (cache.size >= MAX_CACHE_ITEMS) {
        const oldestKey = cache.keys().next().value;

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}