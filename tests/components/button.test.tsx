import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Web Button component', () => {
  it('renders button with label and responds to clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Explore Gyms</Button>);

    const button = screen.getByRole('button', { name: /explore gyms/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when loading is true', () => {
    render(<Button loading>Processing</Button>);

    const button = screen.getByRole('button', { name: /processing/i });
    expect(button).toBeDisabled();
  });
});
