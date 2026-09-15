import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the calculator and the history', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Calculator', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Calculator' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'History' })).toBeInTheDocument();
  });
});
