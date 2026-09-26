import { RoleCode, UserProfile } from './index';

export type AuthMode = 'login' | 'register' | 'forgot_password';

export type LoginType = 'sms' | 'password';

export interface RoleConfig {
  code: RoleCode;
  name: string;
  category: 'patient' | 'clinical' | 'engineering' | 'quality';
  institution: string;
  securityLevel: 'L1' | 'L2' | 'L3' | 'L4';
  securityDesc: string;
  defaultLoginType: LoginType;
  description: string;
  demoAccount: {
    username?: string;
    phone?: string;
    password?: string;
    smsCode?: string;
    realName: string;
    title: string;
  };
}

export interface LoginPayload {
  role: RoleCode;
  loginType: LoginType;
  username?: string;
  password?: string;
  phone?: string;
  smsCode?: string;
  captcha?: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  accountType: 'patient' | 'professional';
  role: RoleCode;
  phone?: string;
  smsCode?: string;
  patientUid?: string;
  realName: string;
  username?: string;
  password?: string;
  institution?: string;
  department?: string;
  staffId?: string;
  credentialProof?: string;
}

export interface ForgotPasswordPayload {
  accountType: 'patient' | 'professional';
  phone?: string;
  smsCode?: string;
  newPassword?: string;
  staffIdOrEmail?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserProfile;
}
