// API Client for Journal App
class JournalAPI {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  logout() {
    this.setToken(null);
  }

  async getProfile() {
    return await this.request('/user/profile');
  }

  // Journal entries methods
  async getEntries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/entries?${queryString}` : '/entries';
    return await this.request(endpoint);
  }

  async getEntry(id) {
    return await this.request(`/entries/${id}`);
  }

  async createEntry(entry) {
    return await this.request('/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateEntry(id, entry) {
    return await this.request(`/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  }

  async deleteEntry(id) {
    return await this.request(`/entries/${id}`, {
      method: 'DELETE',
    });
  }

  async getEntryStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/entries/stats?${queryString}` : '/entries/stats';
    return await this.request(endpoint);
  }

  // Health check
  async healthCheck() {
    return await this.request('/health');
  }
}

// Global API instance
const api = new JournalAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JournalAPI;
} 