define([], function () {
  return class Cache {
    constructor() {
      // Initialize the cache object in the KommoWidget if it does not exist
      window.KommoWidget.cache = window.KommoWidget.cache || {};
    }

    /**
     * Retrieve an item from the cache.
     * @param {string} key - The key for the item to retrieve.
     * @returns {any} - The cached item or null if not found.
     */
    getItem(key) {
      let result;
      // Check if the item is in the KommoWidget cache
      if (window.KommoWidget.cache[key]) {
        result = window.KommoWidget.cache[key];
      } else {
        // Retrieve and parse the item from sessionStorage
        let cache = JSON.parse(window.sessionStorage.getItem(key) || null);
        // If cache exists and is expired, remove it from sessionStorage
        if (cache !== null && cache.expires <= Math.floor(Date.now() / 1000)) {
          window.sessionStorage.removeItem(key);
        }

        // Set result to the payload of the cache or null if not found
        result = (cache || {}).payload || null;
      }
      return result;
    }

    /**
     * Store an item in the cache.
     * @param {string} key - The key for the item to store.
     * @param {any} value - The value to store.
     * @param {number} expires - The expiration time in seconds from now.
     * @param {boolean} local - If true, store in local KommoWidget cache; otherwise, store in sessionStorage.
     */
    setItem(key, value, expires, local) {
      if (local) {
        // Store the item in the KommoWidget cache
        window.KommoWidget.cache[key] = value;
      } else {
        // Store the item in sessionStorage with an expiration time
        window.sessionStorage.setItem(
          key,
          JSON.stringify({
            payload: value,
            expires: Math.floor(Date.now() / 1000) + expires,
          })
        );
      }
    }

    /**
     * Remove an item from sessionStorage.
     * @param {string} key - The key for the item to remove.
     */
    removeItem(key) {
      window.sessionStorage.removeItem(key);
    }
  };
});
