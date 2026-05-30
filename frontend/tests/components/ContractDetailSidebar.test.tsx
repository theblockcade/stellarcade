import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractDetailSidebar } from '../../src/components/v1/ContractDetailSidebar';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ContractDetailSidebar Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders header with title', () => {
    render(<ContractDetailSidebar contractId="test-1" />);
    
    expect(screen.getByText('Related Contracts')).toBeInTheDocument();
  });

  it('renders loading state initially', () => {
    render(<ContractDetailSidebar contractId="test-1" />);
    
    expect(screen.getByText('Loading related contracts...')).toBeInTheDocument();
  });

  it('renders related contracts after loading', async () => {
    render(<ContractDetailSidebar contractId="test-1" />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Contract A')).toBeInTheDocument();
      expect(screen.getByText('Contract B')).toBeInTheDocument();
      expect(screen.getByText('Contract C')).toBeInTheDocument();
    });
  });

  it('displays correct count of related contracts', async () => {
    render(<ContractDetailSidebar contractId="test-1" />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('renders different actions based on contract status', async () => {
    render(<ContractDetailSidebar contractId="test-1" />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      // Active contract should have View and Edit
      expect(screen.getByTestId('contract-1-view')).toBeInTheDocument();
      expect(screen.getByTestId('contract-1-edit')).toBeInTheDocument();
      
      // Locked contract should have View and disabled Edit
      expect(screen.getByTestId('contract-2-view')).toBeInTheDocument();
      expect(screen.getByTestId('contract-2-edit')).toBeInTheDocument();
      expect(screen.getByTestId('contract-2-edit')).toBeDisabled();
      
      // Pending contract should have View and Delete
      expect(screen.getByTestId('contract-3-view')).toBeInTheDocument();
      expect(screen.getByTestId('contract-3-delete')).toBeInTheDocument();
    });
  });

  it('displays disabled reason for locked contracts', async () => {
    render(<ContractDetailSidebar contractId="test-1" />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('Contract is locked and cannot be edited')).toBeInTheDocument();
    });
  });
});
