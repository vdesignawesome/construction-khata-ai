export type SubscriptionPlan = 'free_trial' | 'pro' | 'pro_monthly' | 'pro_yearly' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended';
export type UserRole = 'super_admin' | 'contractor_admin' | 'supervisor';

export const TRIAL_DURATION_DAYS = 120; // 4 months free!

export interface SaasTenant {
  id: string; // Tenant ID (e.g., tenant_171...)
  name: string; // Firm / Company Name (e.g., "Verma Constructions")
  ownerId: string; // Firebase / Local User UID
  ownerEmail: string;
  ownerPhone?: string;
  plan: SubscriptionPlan; // 'free_trial' | 'pro' | 'enterprise'
  status: SubscriptionStatus;
  trialStartDate: number; // Unix timestamp
  trialEndDate: number; // Unix timestamp (120 days from start)
  maxAllowedSites: number; // 1 site for free_trial, 999 for pro
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}

export interface SaasUser {
  id: string; // UID
  tenantId: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  isSuperAdmin?: boolean; // Platform Owner (YOU)
  createdAt: number;
  lastLoginAt?: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret?: string;
  isLiveMode: boolean;
  businessName: string;
}

export interface SubscriptionInvoice {
  id: string; // inv_...
  invoiceNumber: string; // INV-CK-2026-001
  tenantId: string;
  tenantName: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  plan: SubscriptionPlan;
  planName: string;
  durationMonths: number;
  baseAmount: number;
  gstRate: number; // 18%
  gstAmount: number;
  totalAmount: number;
  paymentMethod: string; // 'Razorpay UPI' | 'Razorpay Card' | 'NetBanking'
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  status: 'paid' | 'pending' | 'failed';
  validUntil: number; // Unix timestamp
  issuedAt: number; // Unix timestamp
}
