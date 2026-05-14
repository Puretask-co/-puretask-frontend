// User types
export interface User {
  id: string;
  email: string;
  role: 'client' | 'cleaner' | 'admin';
  full_name?: string;
  phone?: string;
  created_at: string;
  email_verified: boolean;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: 'client' | 'cleaner';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Job/Booking types
import type { JobStatusValue } from '@/constants/jobStatus';

export interface Job {
  id: string;
  client_id: string;
  cleaner_id?: string;
  status: JobStatusValue;
  scheduled_start_at: string;
  scheduled_end_at: string;
  address: string;
  credit_amount: number;
  service_type?: string;
  client_notes?: string;
  created_at: string;
}

export interface CreateJobData {
  scheduled_start_at: string;
  scheduled_end_at: string;
  address: string;
  latitude?: number;
  longitude?: number;
  credit_amount: number;
  client_notes?: string;
}

// Message types
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

export interface SendMessageData {
  recipient_id: string;
  content: string;
}

// Payment types
export interface PaymentIntent {
  client_secret: string;
  amount: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

