import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage, registerSchema } from '../pages/auth/RegisterPage';
import { useAuthStore } from '../store/authStore';

// Mock react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Page Password Requirements & Validation', () => {
  let mockRegister;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegister = vi.fn().mockResolvedValue({ success: true });
    useAuthStore.setState({ register: mockRegister });
  });

  describe('Zod Schema Password Rules', () => {
    const baseValid = {
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543210',
    };

    it('rejects password missing special character', () => {
      const result = registerSchema.safeParse({
        ...baseValid,
        password: 'Password123',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toMatch(/special character/i);
    });

    it('rejects password missing uppercase letter', () => {
      const result = registerSchema.safeParse({
        ...baseValid,
        password: 'password123!',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toMatch(/uppercase letter/i);
    });

    it('rejects password missing number', () => {
      const result = registerSchema.safeParse({
        ...baseValid,
        password: 'Password!@#',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toMatch(/number/i);
    });

    it('rejects too-short password (< 8 chars)', () => {
      const result = registerSchema.safeParse({
        ...baseValid,
        password: 'Pass1!',
      });
      expect(result.success).toBe(false);
      expect(result.error.issues[0].message).toMatch(/at least 8 characters/i);
    });

    it('accepts fully valid password with special characters (@, #, $, !, %)', () => {
      const testCases = [
        'Password123!',
        'Secure#Pass2026',
        'Eventify$99',
        'Bengaluru@2024',
        'Festival%500',
      ];
      for (const pwd of testCases) {
        const result = registerSchema.safeParse({
          ...baseValid,
          password: pwd,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe('UI Component & Real-Time Live Validation', () => {
    it('renders all 4 password requirements and mandatory special character notice with examples', () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      expect(screen.getByText('Password Requirements')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('At least one uppercase letter (A-Z)')).toBeInTheDocument();
      expect(screen.getByText('At least one number (0-9)')).toBeInTheDocument();
      expect(
        screen.getByText(/Mandatory special character \(e\.g\. @, #, \$, !, %\)/i)
      ).toBeInTheDocument();

      // Initially, all 4 should show pending circles
      expect(screen.getByTestId('pending-length')).toBeInTheDocument();
      expect(screen.getByTestId('pending-uppercase')).toBeInTheDocument();
      expect(screen.getByTestId('pending-number')).toBeInTheDocument();
      expect(screen.getByTestId('pending-special')).toBeInTheDocument();
    });

    it('updates requirement checkmarks live as user types', async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText('Password');

      // Type only lowercase letters (no upper, no number, no special, length 4)
      fireEvent.change(passwordInput, { target: { value: 'test' } });
      expect(screen.getByTestId('pending-length')).toBeInTheDocument();
      expect(screen.getByTestId('pending-uppercase')).toBeInTheDocument();
      expect(screen.getByTestId('pending-number')).toBeInTheDocument();
      expect(screen.getByTestId('pending-special')).toBeInTheDocument();

      // Add uppercase
      fireEvent.change(passwordInput, { target: { value: 'testT' } });
      expect(screen.getByTestId('check-uppercase')).toBeInTheDocument();

      // Add number
      fireEvent.change(passwordInput, { target: { value: 'testT9' } });
      expect(screen.getByTestId('check-number')).toBeInTheDocument();

      // Add special character
      fireEvent.change(passwordInput, { target: { value: 'testT9!' } });
      expect(screen.getByTestId('check-special')).toBeInTheDocument();

      // Add character to meet length >= 8
      fireEvent.change(passwordInput, { target: { value: 'testT9!a' } });
      expect(screen.getByTestId('check-length')).toBeInTheDocument();

      // All 4 requirements should now have checkmarks
      expect(screen.getByTestId('check-length')).toBeInTheDocument();
      expect(screen.getByTestId('check-uppercase')).toBeInTheDocument();
      expect(screen.getByTestId('check-number')).toBeInTheDocument();
      expect(screen.getByTestId('check-special')).toBeInTheDocument();
      expect(screen.getByText('4 of 4 met')).toBeInTheDocument();
    });

    it('toggles password visibility when clicking the eye icon', async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByLabelText('Show password');
      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Hide password'));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('prevents submission and displays validation message when password is invalid', async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Aarav Sharma/i), {
        target: { value: 'Devendra Kumar' },
      });
      fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
        target: { value: 'devendra@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/\+91 98765 43210/i), {
        target: { value: '9876543210' },
      });
      // Type password missing special character
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'Password123' },
      });

      const submitButton = screen.getByRole('button', { name: /create attendee account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveTextContent(/special character/i);
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('successfully registers when password satisfies all requirements (Attendee role)', async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      fireEvent.change(screen.getByPlaceholderText(/Aarav Sharma/i), {
        target: { value: 'Devendra Kumar' },
      });
      fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
        target: { value: 'devendra@example.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/\+91 98765 43210/i), {
        target: { value: '9876543210' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'Password123!' },
      });

      const submitButton = screen.getByRole('button', { name: /create attendee account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Devendra Kumar',
          email: 'devendra@example.com',
          phone: '9876543210',
          password: 'Password123!',
          role: 'CUSTOMER',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('applies identical password requirements and succeeds for Event Host role', async () => {
      render(
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      );

      // Switch to Event Host
      const hostTab = screen.getByRole('button', { name: /event host/i });
      fireEvent.click(hostTab);

      expect(screen.getByRole('button', { name: /create host account/i })).toBeInTheDocument();

      // Verify requirements are present
      expect(screen.getByText('Password Requirements')).toBeInTheDocument();
      expect(
        screen.getByText(/Mandatory special character \(e\.g\. @, #, \$, !, %\)/i)
      ).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/Aarav Sharma/i), {
        target: { value: 'Tech Innovations' },
      });
      fireEvent.change(screen.getByPlaceholderText(/name@example.com/i), {
        target: { value: 'host@techinnovations.com' },
      });
      fireEvent.change(screen.getByPlaceholderText(/\+91 98765 43210/i), {
        target: { value: '9876543210' },
      });
      fireEvent.change(screen.getByLabelText('Password'), {
        target: { value: 'HostPass2026#' },
      });

      const submitButton = screen.getByRole('button', { name: /create host account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'Tech Innovations',
          email: 'host@techinnovations.com',
          phone: '9876543210',
          password: 'HostPass2026#',
          role: 'ORGANIZER',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });
});
