define(["./cache.js"], function (Cache) {
  return class Http {
    constructor() {}
    /**
     * Perform an HTTP request with caching support.
     * @param {string} type - The endpoint or path of the request.
     * @param {Object} payload - The data to be sent with the request.
     * @param {string} method - The HTTP method to use (GET, POST, etc.).
     * @param {Object} [options={}] - Additional options for the request.
     * @param {Object} [options.cache] - Cache options.
     * @param {string} [options.cache.key] - The key for caching the request data.
     * @param {number} [options.cache.expires] - Cache expiration time in seconds.
     * @param {boolean} [options.cache.local=false] - Whether to use local cache.
     * @param {string} [options.embedded] - Key for embedded data in the response.
     * @param {string} [options.rk] - Key to extract specific data from the response.
     * @param {string} [options.baseURL] - The base URL for the request.
     * @param {Object} [options.headers] - Custom headers for the request.
     * @returns {Promise} - A promise that resolves with the response data.
     */
    request(type, payload, method, options = {}) {
      // Create a new Cache instance
      let cache = new Cache();
      return new Promise(function (resolve, reject) {
        let data = null;
        // Check if caching is enabled and try to retrieve data from cache
        if (options.cache) {
          data = cache.getItem(options.cache.key);
        }

        // If data is not in cache, perform an AJAX request
        if (!data) {
          $.ajax({
            url: options.baseURL + type,
            data: payload,
            method: method,
            beforeSend: function (xhr) {
              xhr.withCredentials = true;
            },
            headers: options.headers || {},
          })
            .done(function (data) {
              resolve(data);
            })
            .fail(function (resp) {
              reject(resp);
            });
        } else {
          resolve(data);
        }
      }).then(function (data) {
        return new Promise(function (resolve) {
          // If an embedded key is provided, extract the embedded data
          if (options.embedded && (data || {})["_embedded"]) {
            data = (data || {})["_embedded"][options.embedded] || [];
          }

          // Cache the response data if caching is enabled
          if (options.cache && data) {
            cache.setItem(
              options.cache.key,
              data,
              options.cache.expires,
              options.cache.local || false
            );
          }

          // If a result key is provided, extract specific data
          if (options.rk) {
            data = (data || {})[options.rk] || null;
          }

          // Resolve with the final data
          resolve(data);
        });
      });
    }
  };
});
