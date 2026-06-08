export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}