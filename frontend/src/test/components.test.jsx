import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EventCard } from '../components/events/EventCard';
import { formatCurrency, formatDate } from '../utils/formatters';

describe('Frontend Component & Utility Tests', () => {
  it('formats currency correctly in INR (₹)', () => {
    expect(formatCurrency(1499)).toMatch(/₹\s?1,499/);
    expect(formatCurrency(0)).toMatch(/₹\s?0/);
    expect(formatCurrency(2500000)).toMatch(/₹\s?25,00,000/);
  });

  it('formats dates properly', () => {
    const formatted = formatDate('2026-11-20T10:00:00Z', 'dd MMM yyyy');
    expect(formatted).toContain('20 Nov 2026');
  });

  it('renders Button with variants and loading state', () => {
    const { rerender } = render(<Button variant="primary">Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();

    rerender(<Button isLoading>Loading Action</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders Badge with correct variant', () => {
    render(<Badge variant="success">Confirmed</Badge>);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('renders EventCard with event details and price', () => {
    const mockEvent = {
      id: 'mock-1',
      title: 'Bangalore AI Summit 2026',
      slug: 'bangalore-ai-summit-2026',
      category: 'HACKATHON',
      startDate: '2026-12-15T09:00:00Z',
      startingPrice: 499,
      totalAvailableTickets: 50,
      venue: { name: 'Gayatri Vihar', city: 'Bengaluru' },
    };

    render(
      <BrowserRouter>
        <EventCard event={mockEvent} />
      </BrowserRouter>
    );

    expect(screen.getByText('Bangalore AI Summit 2026')).toBeInTheDocument();
    expect(screen.getByText('HACKATHON')).toBeInTheDocument();
    expect(screen.getByText(/50 left/)).toBeInTheDocument();
    expect(screen.getByText(/499/)).toBeInTheDocument();
  });
});
