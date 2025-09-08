import { useEffect, useState } from 'react';
import { API_BASE_URL } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Token validation utilities
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // If we can't parse the token, consider it expired
  }
}

function getTokenExpirationTime(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
}

export const auth = {
  // Register function
  async register(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
  },

  // Login function
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed');
    }

    return response.json();
  },

  // Store token in localStorage
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      // Set up automatic logout when token expires
      this.scheduleTokenExpirationCheck(token);
    }
  },

  // Get token from localStorage
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  // Get valid token (returns null if expired)
  getValidToken(): string | null {
    const token = this.getToken();
    if (!token || isTokenExpired(token)) {
      this.logout();
      return null;
    }
    return token;
  },

  // Remove token from localStorage
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // Clear any scheduled logout
      if (this.logoutTimeoutId) {
        clearTimeout(this.logoutTimeoutId);
        this.logoutTimeoutId = null;
      }
      // Redirect to login page
      window.location.href = '/login';
    }
  },

  // Check if user is logged in with valid token
  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !isTokenExpired(token);
  },

  // Schedule automatic logout when token expires
  logoutTimeoutId: null as NodeJS.Timeout | null,
  scheduleTokenExpirationCheck(token: string): void {
    const expirationTime = getTokenExpirationTime(token);
    if (expirationTime) {
      const timeUntilExpiry = expirationTime - Date.now();
      if (timeUntilExpiry > 0) {
        // Clear any existing timeout
        if (this.logoutTimeoutId) {
          clearTimeout(this.logoutTimeoutId);
        }
        // Schedule logout 1 minute before expiry (with some buffer)
        this.logoutTimeoutId = setTimeout(() => {
          this.logout();
        }, Math.max(timeUntilExpiry - 60000, 0));
      } else {
        // Token is already expired
        this.logout();
      }
    }
  },

  // Handle API errors (check for 401 and logout if needed)
  handleApiError(response: Response): void {
    if (response.status === 401) {
      console.log('Authentication error detected, logging out...');
      this.logout();
    }
  },
};

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = () => {
      const valid = auth.isLoggedIn();
      setIsLoggedIn(valid);
      setLoading(false);
      
      // If token is expired, logout immediately
      if (auth.getToken() && !valid) {
        auth.logout();
      }
    };
    
    checkAuth();
    
    const onStorage = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  
  return { isLoggedIn, loading };
} 