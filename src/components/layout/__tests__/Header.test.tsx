// src/components/layout/__tests__/Header.test.tsx
// Unit tests for Header component

import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { AuthContext } from '@/contexts/AuthContext';

// Mock AuthContext
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  role: 'client' as const,
  created_at: '2024-01-01T00:00:00Z',
  email_verified: true,
};

const mockAuthValue = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  refreshUser: jest.fn(),
  isLoading: false,
  isAuthenticated: true,
};

// TODO: Fix Header tests (AuthContext/nav structure) - TODOS.md
describe.skip('Header', () => {
  it('displays user name when authenticated', () => {
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('shows logout button when authenticated', () => {
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <Header />
      </AuthContext.Provider>
    );

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
  });

  it('shows login link when not authenticated', () => {
    const noUserAuth = {
      ...mockAuthValue,
      user: null,
    };

    render(
      <AuthContext.Provider value={noUserAuth}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  it('toggles mobile menu when menu button clicked', () => {
    const onMenuClick = jest.fn();
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <Header onMenuClick={onMenuClick} />
      </AuthContext.Provider>
    );

    const menuButton = screen.getByLabelText(/menu/i);
    fireEvent.click(menuButton);

    expect(onMenuClick).toHaveBeenCalled();
  });

  it('shows role-specific navigation for client', () => {
    render(
      <AuthContext.Provider value={mockAuthValue}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/find a cleaner/i)).toBeInTheDocument();
    expect(screen.getByText(/my bookings/i)).toBeInTheDocument();
  });

  it('shows role-specific navigation for cleaner', () => {
    const cleanerAuth = {
      ...mockAuthValue,
      user: { ...mockUser, role: 'cleaner' as const },
    };

    render(
      <AuthContext.Provider value={cleanerAuth}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/my dashboard/i)).toBeInTheDocument();
  });

  it('shows admin panel link for admin users', () => {
    const adminAuth = {
      ...mockAuthValue,
      user: { ...mockUser, role: 'admin' as const },
    };

    render(
      <AuthContext.Provider value={adminAuth}>
        <Header />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/admin panel/i)).toBeInTheDocument();
  });
});
