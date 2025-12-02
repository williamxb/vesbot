class TokenManager {
  constructor(authConfig) {
    this.authUrl = authConfig.authUrl;
    this.credentials = authConfig.credentials;
    this.token = null;
    this.tokenExpiry = null;
    this.tokenDuration = authConfig.tokenDuration || 3600000; // Default 1 hour
    this.refreshBuffer = authConfig.refreshBuffer || 60000;
    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  /**
   * Extract expiry from response if provided
   */
  extractExpiry(data) {
    // Check if API returns expiry info
    if (data.expiresIn) {
      return Date.now() + (data.expiresIn * 1000);
    }
    if (data.expiresAt) {
      return new Date(data.expiresAt).getTime();
    }
    // Default: assume token valid for configured duration
    return Date.now() + (this.tokenDuration || 3600000); // 1 hour default
  }

  async authenticate() {
    try {
      const response = await fetch(this.authUrl, {
        method: 'POST',
        headers: { 
          'accept': 'application/json, text/plain, */*',
          'content-type': 'application/json;charset=UTF-8'
        },
        body: JSON.stringify(this.credentials)
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token.token;
      
      return this.token;
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw error;
    }
  }

  needsRefresh() {
    if (!this.token || !this.tokenExpiry) {
      return true;
    }
    return Date.now() >= (this.tokenExpiry - this.refreshBuffer);
  }

  async getToken() {
    if (this.needsRefresh()) {
      if (this.isRefreshing) {
        return this.refreshPromise;
      }

      this.isRefreshing = true;
      this.refreshPromise = this.authenticate()
        .finally(() => {
          this.isRefreshing = false;
          this.refreshPromise = null;
        });

      return this.refreshPromise;
    }

    return this.token;
  }

  async fetch(url, options = {}) {
    const token = await this.getToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    let response = await fetch(url, { ...options, headers });

    // Retry once on 401
    if (response.status === 401 && !options._retry) {
      this.token = null;
      const newToken = await this.getToken();
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(url, { 
        ...options, 
        headers,
        _retry: true 
      });
    }

    return response;
  }

  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
  }
}

module.exports = TokenManager;