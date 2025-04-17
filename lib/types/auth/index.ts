export interface LoginCredentials {
  username: string;
  password: string;
  pushToken: string;
}
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user?: User;
    token?: string;
    tempToken?: string;
    require2FA?: boolean;
  };
}
export interface Verify2FARequest {
  token: string;
  otp: string;
}
