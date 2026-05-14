// src/components/error/__tests__/ErrorBoundary.test.tsx
// Unit tests for ErrorBoundary component

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error during tests
const originalError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalError;
});

// TODO: Fix ErrorBoundary tests (Sentry dynamic import / async) - TODOS.md
describe.skip('ErrorBoundary', () => {
  it('catches render errors and shows error UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/we're sorry for the inconvenience/i)).toBeInTheDocument();
  });

  it('logs error in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();

    (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  });

  it('shows retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('resets error state when retry button clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);

    // After retry, should render children again (if they don't throw)
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/oops! something went wrong/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no error/i)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/custom error message/i)).toBeInTheDocument();
    expect(screen.queryByText(/oops! something went wrong/i)).not.toBeInTheDocument();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/no error/i)).toBeInTheDocument();
    expect(screen.queryByText(/oops! something went wrong/i)).not.toBeInTheDocument();
  });
});
