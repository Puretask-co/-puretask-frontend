// src/components/layout/__tests__/Header.test.tsx
// Unit tests for Header component

import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { AuthContext } from '@/contexts/AuthContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/client',
}));

jest.mock('@/components/ui/BackButton', () => ({
  BackButton: () => <button type="button">Back</button>,
}));

jest.mock('@/components/features/notifications/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

jest.mock('../MobileNav', () => ({
  MobileNav: () => <div data-testid="mobile-nav" />,
}));

// Mock AuthContext
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'client' as const,
};

const mockAuthValue = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  isAuthenticated: true,
  register: jest.fn(),
  refreshUser: jest.fn(),
};

function renderHeader(authOverrides: Partial<typeof mockAuthValue> = {}) {
  const value = {
    ...mockAuthValue,
    ...authOverrides,
  };

  return render(
    <AuthContext.Provider value={value}>
      <Header />
    </AuthContext.Provider>
  );
}

describe('Header', () => {
  it('displays user name when authenticated', () => {
    renderHeader();

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('shows notification bell when authenticated', () => {
    renderHeader();

    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  it('shows login link when not authenticated', () => {
    renderHeader({ user: null, isAuthenticated: false });

    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it('renders mobile nav component', () => {
    renderHeader();

    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('toggles search bar when search button clicked', () => {
    renderHeader();

    const searchButton = screen.getByLabelText(/toggle search/i);
    fireEvent.click(searchButton);

    expect(
      screen.getByPlaceholderText(/search bookings, cleaners, clients/i)
    ).toBeInTheDocument();
  });

  it('shows role-specific navigation for client', () => {
    renderHeader();

    expect(screen.getAllByText('Credits').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Book').length).toBeGreaterThan(0);
  });

  it('shows role-specific navigation for cleaner', () => {
    renderHeader({ user: { ...mockUser, role: 'cleaner' as const } });

    expect(screen.getAllByText('Today').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Earnings').length).toBeGreaterThan(0);
  });

  it('shows admin panel link for admin users', () => {
    renderHeader({ user: { ...mockUser, role: 'admin' as const } });

    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gamification').length).toBeGreaterThan(0);
  });
});
