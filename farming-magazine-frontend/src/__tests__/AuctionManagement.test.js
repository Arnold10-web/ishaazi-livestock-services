import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuctionManagement from '../admin/AuctionManagement';

// Mock the API config
jest.mock('../config/apiConfig', () => ({
  auctions: {
    getAdminAuctions: '/api/admin/auctions',
    createAuction: '/api/auctions',
    updateAuction: '/api/auctions/:id',
    deleteAuction: '/api/auctions/:id'
  }
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

const mockAuctions = [
  {
    _id: '1',
    title: 'Premium Cattle Auction',
    description: 'High-quality cattle for auction',
    livestockCategory: 'cattle',
    auctioneerName: 'John Doe',
    auctioneerContact: '123-456-7890',
    location: 'Farm Valley',
    date: '2025-06-15T10:00:00.000Z',
    estimatedPrice: 5000,
    status: 'upcoming',
    interestedBuyers: ['buyer1', 'buyer2'],
    image: 'auction1.jpg'
  },
  {
    _id: '2',
    title: 'Goat Sale Event',
    description: 'Quality goats available',
    livestockCategory: 'goats',
    auctioneerName: 'Jane Smith',
    auctioneerContact: '098-765-4321',
    location: 'Hill Country',
    date: '2025-06-20T14:00:00.000Z',
    estimatedPrice: 2000,
    status: 'live',
    interestedBuyers: [],
    image: null
  }
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AuctionManagement />
    </BrowserRouter>
  );
};

describe('AuctionManagement Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    window.confirm = jest.fn(() => true);
  });

  test('renders auction management title', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();
    
    expect(screen.getByText('Auction Management')).toBeInTheDocument();
    expect(screen.getByText('Create Auction')).toBeInTheDocument();
  });

  test('loads and displays auctions', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Premium Cattle Auction')).toBeInTheDocument();
      expect(screen.getByText('Goat Sale Event')).toBeInTheDocument();
    });

    expect(screen.getByText('High-quality cattle for auction')).toBeInTheDocument();
    expect(screen.getByText('Quality goats available')).toBeInTheDocument();
    expect(screen.getByText('Farm Valley')).toBeInTheDocument();
    expect(screen.getByText('Hill Country')).toBeInTheDocument();
  });

  test('displays auction status correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('upcoming')).toBeInTheDocument();
      expect(screen.getByText('live')).toBeInTheDocument();
    });
  });

  test('opens create auction modal', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    const createButton = screen.getByText('Create Auction');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Auction')).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });
  });

  test('submits new auction form', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAuctions })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [...mockAuctions, { _id: '3', title: 'New Auction' }] })
      });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Create Auction')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Auction');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Auction')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: 'Test Auction' }
    });
    fireEvent.change(screen.getByLabelText(/Description/), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByLabelText(/Auctioneer Name/), {
      target: { value: 'Test Auctioneer' }
    });
    fireEvent.change(screen.getByLabelText(/Contact/), {
      target: { value: '123-456-7890' }
    });
    fireEvent.change(screen.getByLabelText(/Location/), {
      target: { value: 'Test Location' }
    });
    fireEvent.change(screen.getByLabelText(/Date & Time/), {
      target: { value: '2025-07-01T10:00' }
    });

    // Submit form
    const submitButton = screen.getByText('Create Auction');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auctions', expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      }));
    });
  });

  test('deletes auction when confirmed', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAuctions })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockAuctions[1]] })
      });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Premium Cattle Auction')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/Delete/);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auctions/1', expect.objectContaining({
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer mock-token'
        }
      }));
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Error fetching auctions/)).toBeInTheDocument();
    });
  });

  test('displays empty state when no auctions', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No auctions found')).toBeInTheDocument();
      expect(screen.getByText('Create your first auction to get started.')).toBeInTheDocument();
    });
  });

  test('opens edit modal with existing auction data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Premium Cattle Auction')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/Edit/);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Edit Auction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Premium Cattle Auction')).toBeInTheDocument();
      expect(screen.getByDisplayValue('High-quality cattle for auction')).toBeInTheDocument();
    });
  });

  test('filters auctions by category display', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cattle')).toBeInTheDocument();
      expect(screen.getByText('Goats')).toBeInTheDocument();
    });
  });

  test('formats date correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    await waitFor(() => {
      // Check if dates are formatted (looking for month abbreviations)
      expect(screen.getByText(/Jun/)).toBeInTheDocument();
    });
  });

  test('displays interested buyers count', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('2 interested')).toBeInTheDocument();
      expect(screen.getByText('0 interested')).toBeInTheDocument();
    });
  });

  test('cancels form and resets data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockAuctions })
    });

    renderComponent();

    const createButton = screen.getByText('Create Auction');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Auction')).toBeInTheDocument();
    });

    // Fill some data
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: 'Test Title' }
    });

    // Cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Open again and verify reset
    fireEvent.click(screen.getByText('Create Auction'));

    await waitFor(() => {
      expect(screen.getByLabelText(/Title/)).toHaveValue('');
    });
  });
});
