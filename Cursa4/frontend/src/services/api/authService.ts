import { apiClient } from './apiClient';
import { User, LoginRequest, RegisterRequest, UpdateProfileRequest } from '../models/user';

export const authService = {
  async login(credentials: LoginRequest): Promise<User> {
    const response = await apiClient.post<{ user: User; token: string } | User>('/auth/login', credentials);
    
    // Handle different response formats
    let userData: User;
    let token: string | null = null;
    
    if ('user' in response.data && 'token' in response.data) {
      // Response format: { user: User, token: string }
      userData = response.data.user;
      token = response.data.token;
    } else if ('token' in response.data) {
      // Response format: User with token property
      userData = response.data as unknown as User;
      token = (response.data as any).token;
    } else {
      // Response format: just User, check headers for token
      userData = response.data as User;
      // Axios normalizes headers to lowercase
      const authHeader = response.headers['authorization'] || response.headers['x-auth-token'];
      token = authHeader ? (typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : authHeader) : null;
    }
    
    // Save token if found
    if (token) {
      localStorage.setItem('authToken', token);
    }

    const withId = userData as User & { id?: number };
    const userId = typeof withId.userId === 'number' ? withId.userId : (withId.id ?? 0);
    return { ...userData, userId };
  },

  async register(userData: RegisterRequest): Promise<{ message: string; userId: number }> {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  async updateProfile(userId: number, data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<Record<string, unknown>>(`/auth/profile/${userId}`, data);
    const raw = response.data;
    const uidRaw = raw.userId ?? raw.id ?? raw.UserId ?? raw.Id ?? userId;
    const userIdNum = typeof uidRaw === 'number' ? uidRaw : parseInt(String(uidRaw), 10);
    return {
      userId: userIdNum,
      email: String(raw.email ?? raw.Email ?? ''),
      firstName: String(raw.firstName ?? raw.FirstName ?? ''),
      lastName: String(raw.lastName ?? raw.LastName ?? ''),
      phone: String(raw.phone ?? raw.Phone ?? ''),
      roleName: String(raw.roleName ?? raw.RoleName ?? ''),
    };
  },

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    try {
      const p = JSON.parse(userStr) as Record<string, unknown>;
      const uidRaw = p.userId ?? p.id ?? p.UserId ?? p.Id;
      const userId =
        typeof uidRaw === 'number' && !Number.isNaN(uidRaw)
          ? uidRaw
          : typeof uidRaw === 'string'
            ? parseInt(uidRaw, 10)
            : NaN;
      if (!Number.isFinite(userId) || userId <= 0) return null;
      const user: User = {
        userId,
        email: String(p.email ?? p.Email ?? ''),
        firstName: String(p.firstName ?? p.FirstName ?? ''),
        lastName: String(p.lastName ?? p.LastName ?? ''),
        phone: String(p.phone ?? p.Phone ?? ''),
        roleName: String(p.roleName ?? p.RoleName ?? ''),
      };
      if (typeof p.userId !== 'number' || p.userId !== userId) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      }
      return user;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.roleName === 'Admin';
  }
};