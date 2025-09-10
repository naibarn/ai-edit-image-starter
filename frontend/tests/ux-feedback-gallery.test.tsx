import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import EditPage from '../app/edit/page';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('UX Feedback & Gallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows toast error when API fails', async () => {
    // Mock failed API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'API Error' }),
    });

    render(<EditPage />);

    const submitButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('shows progress bar during generation', async () => {
    // Mock successful API response with delay
    (global.fetch as any).mockImplementationOnce(
      () => new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ image_url: 'test.png' }),
        }), 100)
      )
    );

    render(<EditPage />);

    const submitButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(submitButton);

    // Progress bar should appear
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  test('renders gallery with generated images', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ image_url: 'generated.png' }),
    });

    render(<EditPage />);

    const submitButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const image = screen.getByAltText('Generated image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'generated.png');
    });
  });

  test('download button has correct href', async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ image_url: '/output/test.png' }),
    });

    render(<EditPage />);

    const submitButton = screen.getByRole('button', { name: /generate/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveAttribute('href', '/output/test.png');
    });
  });
});