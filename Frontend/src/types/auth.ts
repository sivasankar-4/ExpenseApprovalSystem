export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetTokenResponse {
  resetToken: string;
}

export interface LoginResponse {
  accessToken: string;
  // refreshToken is intentionally absent here.
  // The backend sends it exclusively as an HttpOnly Secure SameSite=Strict
  // cookie — it is never visible to JavaScript.
  tokenType: string;
}
