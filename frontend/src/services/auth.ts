interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthToken {
  token: string;
  expiresAt: number;
}

class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly EXPIRY_KEY = 'authTokenExpiry';

  async login(username: string, password: string): Promise<void> {
    try {
      // For demo purposes, accept any non-empty credentials
      if (!username.trim() || !password.trim()) {
        throw new Error('Username and password are required');
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate a mock token
      const token = btoa(`${username}:${Date.now()}`);
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

      this.setToken(token, expiresAt);
    } catch (error) {
      throw new Error('Invalid credentials');
    }
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiry = localStorage.getItem(this.EXPIRY_KEY);
    
    if (!token || !expiry) {
      return false;
    }

    const expiryTime = parseInt(expiry, 10);
    if (Date.now() > expiryTime) {
      this.logout();
      return false;
    }

    return true;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string, expiresAt: number): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.EXPIRY_KEY, expiresAt.toString());
  }

  getCurrentUser(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decoded = atob(token);
      const [username] = decoded.split(':');
      return username;
    } catch {
      return null;
    }
  }
}

const authService = new AuthService();

export const login = (username: string, password: string) => 
  authService.login(username, password);

export const logout = () => authService.logout();

export const isAuthenticated = () => authService.isAuthenticated();

export const getToken = () => authService.getToken();

export const getCurrentUser = () => authService.getCurrentUser();

export default authService;